const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const MarkdownIt = require('markdown-it');

let pipeline;
(async () => {
    pipeline = (await import('@xenova/transformers')).pipeline;
})();

class DocumentProcessor {
    constructor() {
        this.md = new MarkdownIt();
        this.documents = new Map();
        this.embeddings = new Map();
        this.embeddingModel = null;
        this.initializeEmbeddings();
    }

    async initializeEmbeddings() {
        try {
            // Initialize the embedding model for RAG
            this.embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            console.log('Embedding model loaded successfully');
        } catch (error) {
            console.error('Error loading embedding model:', error);
        }
    }

    async processFile(filePath, fileName) {
        try {
            const ext = path.extname(fileName).toLowerCase();
            let content = '';
            let metadata = {
                fileName,
                filePath,
                fileType: ext,
                processedAt: new Date().toISOString(),
                size: 0
            };

            const fileBuffer = await fs.readFile(filePath);
            metadata.size = fileBuffer.length;

            switch (ext) {
                case '.txt':
                    content = fileBuffer.toString('utf-8');
                    break;
                case '.md':
                    const rawMarkdown = fileBuffer.toString('utf-8');
                    content = this.md.render(rawMarkdown);
                    // Also store the raw markdown
                    metadata.rawContent = rawMarkdown;
                    break;
                case '.pdf':
                    const pdfData = await pdfParse(fileBuffer);
                    content = pdfData.text;
                    metadata.pages = pdfData.numpages;
                    break;
                default:
                    throw new Error(`Unsupported file type: ${ext}`);
            }

            // Clean and chunk the content
            const chunks = this.chunkText(content);
            const docId = this.generateDocId(fileName);
            
            const document = {
                id: docId,
                content,
                chunks,
                metadata
            };

            this.documents.set(docId, document);

            // Generate embeddings for RAG
            if (this.embeddingModel) {
                await this.generateEmbeddings(docId, chunks);
            }

            return {
                success: true,
                document,
                message: `Successfully processed ${fileName} (${chunks.length} chunks)`
            };

        } catch (error) {
            console.error('Error processing file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    chunkText(text, maxChunkSize = 1000, overlap = 200) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length < maxChunkSize) {
                currentChunk += sentence + '. ';
            } else {
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                }
                // Start new chunk with overlap
                const words = currentChunk.split(' ');
                const overlapWords = words.slice(-Math.floor(overlap / 10));
                currentChunk = overlapWords.join(' ') + ' ' + sentence + '. ';
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [text]; // Fallback to original text if chunking fails
    }

    async generateEmbeddings(docId, chunks) {
        try {
            const embeddings = [];
            for (let i = 0; i < chunks.length; i++) {
                const embedding = await this.embeddingModel(chunks[i]);
                embeddings.push({
                    chunkIndex: i,
                    text: chunks[i],
                    embedding: Array.from(embedding.data)
                });
            }
            this.embeddings.set(docId, embeddings);
            console.log(`Generated embeddings for ${docId}: ${embeddings.length} chunks`);
        } catch (error) {
            console.error('Error generating embeddings:', error);
        }
    }

    async searchSimilar(query, topK = 5) {
        if (!this.embeddingModel) {
            return [];
        }

        try {
            // Generate embedding for the query
            const queryEmbedding = await this.embeddingModel(query);
            const queryVector = Array.from(queryEmbedding.data);
            
            const results = [];

            // Search through all document embeddings
            for (const [docId, docEmbeddings] of this.embeddings.entries()) {
                const document = this.documents.get(docId);
                
                for (const chunk of docEmbeddings) {
                    const similarity = this.cosineSimilarity(queryVector, chunk.embedding);
                    results.push({
                        docId,
                        fileName: document.metadata.fileName,
                        chunkIndex: chunk.chunkIndex,
                        text: chunk.text,
                        similarity
                    });
                }
            }

            // Sort by similarity and return top K
            return results
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK);

        } catch (error) {
            console.error('Error searching similar content:', error);
            return [];
        }
    }

    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }

    generateDocId(fileName) {
        return fileName + '_' + Date.now();
    }

    getDocument(docId) {
        return this.documents.get(docId);
    }

    getAllDocuments() {
        return Array.from(this.documents.values());
    }

    removeDocument(docId) {
        this.documents.delete(docId);
        this.embeddings.delete(docId);
        return true;
    }

    async augmentPromptWithContext(prompt, topK = 3) {
        const similarChunks = await this.searchSimilar(prompt, topK);
        
        if (similarChunks.length === 0) {
            return prompt;
        }

        const context = similarChunks
            .map(chunk => `[From ${chunk.fileName}]: ${chunk.text}`)
            .join('\n\n');

        return `Context from uploaded documents:
${context}

User question: ${prompt}`;
    }
}

module.exports = DocumentProcessor;