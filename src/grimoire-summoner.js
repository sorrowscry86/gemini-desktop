const { spawn } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Forbidden Library Grimoire Summoner
 * Handles dynamic summoning of MCP servers from remote repositories
 * (Previously known as "add_tool" functionality)
 */
class GrimoireSummoner {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.grimoireDir = options.grimoireDir || path.join(process.cwd(), 'summoned-grimoires');
        this.activeGrimoires = new Map();
        this.summonedTools = new Map();
        
        this.log('Grimoire Summoner initialized', { grimoireDir: this.grimoireDir });
        this.ensureGrimoireDirectory();
    }

    log(message, data = {}, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...data
        };
        
        if (this.debug || level === 'error') {
            console.log(`[GRIMOIRE-${level.toUpperCase()}] ${timestamp}: ${message}`, data);
        }
    }

    async ensureGrimoireDirectory() {
        try {
            await fs.mkdir(this.grimoireDir, { recursive: true });
            this.log('Grimoire directory ensured', { path: this.grimoireDir });
        } catch (error) {
            this.log('Failed to create grimoire directory', { error: error.message }, 'error');
            throw error;
        }
    }

    /**
     * Summon a grimoire (MCP server) from a remote repository
     * @param {Object} summonConfig - Configuration for summoning
     * @param {string} summonConfig.name - Name of the grimoire
     * @param {string} summonConfig.repository - GitHub repository URL
     * @param {string} summonConfig.command - Command to run the server
     * @param {Array} summonConfig.args - Arguments for the command
     * @param {string} summonConfig.description - Description of the grimoire
     */
    async summonGrimoire(summonConfig) {
        const { name, repository, command = 'uvx', args = [], description = '' } = summonConfig;
        const grimoireId = uuidv4();
        
        this.log('Attempting to summon grimoire', { 
            grimoireId, 
            name, 
            repository,
            command,
            args
        });

        try {
            // Validate configuration
            if (!name || !repository) {
                throw new Error('Grimoire name and repository are required for summoning');
            }

            // Check if grimoire already exists
            if (this.activeGrimoires.has(name)) {
                this.log('Grimoire already summoned', { name }, 'warn');
                return {
                    success: false,
                    error: `Grimoire "${name}" is already active`,
                    existingId: this.activeGrimoires.get(name).id
                };
            }

            // Create grimoire workspace
            const grimoireWorkspace = path.join(this.grimoireDir, name);
            await fs.mkdir(grimoireWorkspace, { recursive: true });

            // Prepare the summoning ritual (command execution)
            const summonArgs = this.prepareSummonArgs(repository, args);
            
            this.log('Preparing summoning ritual', { 
                command, 
                args: summonArgs,
                workspace: grimoireWorkspace 
            });

            // Execute the summoning
            const summonResult = await this.executeSummon(command, summonArgs, grimoireWorkspace);
            
            if (!summonResult.success) {
                throw new Error(`Summoning failed: ${summonResult.error}`);
            }

            // Register the summoned grimoire
            const grimoire = {
                id: grimoireId,
                name,
                repository,
                command,
                args: summonArgs,
                description,
                workspace: grimoireWorkspace,
                summonedAt: new Date().toISOString(),
                process: summonResult.process,
                port: summonResult.port,
                status: 'active'
            };

            this.activeGrimoires.set(name, grimoire);
            
            this.log('Grimoire successfully summoned', { 
                grimoireId, 
                name,
                port: summonResult.port,
                workspace: grimoireWorkspace
            });

            return {
                success: true,
                grimoireId,
                name,
                port: summonResult.port,
                message: `Grimoire "${name}" has been summoned from the forbidden repository`,
                grimoire: {
                    id: grimoireId,
                    name,
                    repository,
                    description,
                    port: summonResult.port,
                    summonedAt: grimoire.summonedAt
                }
            };

        } catch (error) {
            this.log('Grimoire summoning failed', { 
                grimoireId, 
                name, 
                error: error.message 
            }, 'error');
            
            return {
                success: false,
                error: error.message,
                grimoireId
            };
        }
    }

    /**
     * Prepare arguments for the summoning command
     */
    prepareSummonArgs(repository, additionalArgs = []) {
        const baseArgs = ['--from', `git+${repository}`];
        return [...baseArgs, ...additionalArgs];
    }

    /**
     * Execute the actual summoning command
     */
    async executeSummon(command, args, workspace) {
        return new Promise((resolve, reject) => {
            this.log('Executing summoning command', { command, args, workspace });

            const process = spawn(command, args, {
                cwd: workspace,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env }
            });

            let stdout = '';
            let stderr = '';
            let port = null;

            process.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                
                // Try to extract port information
                const portMatch = output.match(/(?:port|listening|server).*?(\d{4,5})/i);
                if (portMatch && !port) {
                    port = parseInt(portMatch[1]);
                    this.log('Detected grimoire port', { port });
                }
                
                if (this.debug) {
                    console.log(`[GRIMOIRE-STDOUT]: ${output}`);
                }
            });

            process.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                
                if (this.debug) {
                    console.log(`[GRIMOIRE-STDERR]: ${output}`);
                }
            });

            process.on('close', (code) => {
                if (code === 0) {
                    this.log('Summoning command completed successfully', { code, port });
                    resolve({
                        success: true,
                        process,
                        port: port || 8080, // Default port if not detected
                        stdout,
                        stderr
                    });
                } else {
                    this.log('Summoning command failed', { code, stderr }, 'error');
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });

            process.on('error', (error) => {
                this.log('Summoning process error', { error: error.message }, 'error');
                reject(error);
            });

            // Give the process a moment to start
            setTimeout(() => {
                if (process.pid) {
                    resolve({
                        success: true,
                        process,
                        port: port || 8080,
                        stdout,
                        stderr
                    });
                }
            }, 3000);
        });
    }

    /**
     * Banish a grimoire (stop and remove)
     */
    async banishGrimoire(name) {
        this.log('Attempting to banish grimoire', { name });

        const grimoire = this.activeGrimoires.get(name);
        if (!grimoire) {
            return {
                success: false,
                error: `Grimoire "${name}" is not currently summoned`
            };
        }

        try {
            // Terminate the process if it's still running
            if (grimoire.process && !grimoire.process.killed) {
                grimoire.process.kill('SIGTERM');
                
                // Give it a moment to gracefully shut down
                setTimeout(() => {
                    if (!grimoire.process.killed) {
                        grimoire.process.kill('SIGKILL');
                    }
                }, 5000);
            }

            // Remove from active grimoires
            this.activeGrimoires.delete(name);
            
            this.log('Grimoire successfully banished', { name });
            
            return {
                success: true,
                message: `Grimoire "${name}" has been banished to the void`
            };

        } catch (error) {
            this.log('Failed to banish grimoire', { name, error: error.message }, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List all active grimoires
     */
    listActiveGrimoires() {
        const grimoires = Array.from(this.activeGrimoires.values()).map(grimoire => ({
            id: grimoire.id,
            name: grimoire.name,
            repository: grimoire.repository,
            description: grimoire.description,
            port: grimoire.port,
            summonedAt: grimoire.summonedAt,
            status: grimoire.status
        }));

        this.log('Listing active grimoires', { count: grimoires.length });
        return grimoires;
    }

    /**
     * Get grimoire details by name
     */
    getGrimoire(name) {
        const grimoire = this.activeGrimoires.get(name);
        if (!grimoire) {
            return null;
        }

        return {
            id: grimoire.id,
            name: grimoire.name,
            repository: grimoire.repository,
            description: grimoire.description,
            port: grimoire.port,
            summonedAt: grimoire.summonedAt,
            status: grimoire.status,
            workspace: grimoire.workspace
        };
    }

    /**
     * Cleanup all grimoires on shutdown
     */
    async banishAllGrimoires() {
        this.log('Banishing all active grimoires');
        
        const banishPromises = Array.from(this.activeGrimoires.keys()).map(name => 
            this.banishGrimoire(name)
        );
        
        await Promise.all(banishPromises);
        this.log('All grimoires have been banished');
    }
}

module.exports = GrimoireSummoner;