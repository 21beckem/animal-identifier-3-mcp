import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from 'express';
import cors from 'cors';


export default class McpServerWrapper {
    constructor(config={}, setupServerFunc) {
        const { name, version, port } = config;
        if (typeof setupServerFunc !== 'function') {
            throw new Error("setupServerFunc must be a function that takes 1 argument (the McpServer instance).");
        }
        this.name = name ?? 'MCP Server Wrapper';
        this.version = version ?? '1.0.0';
        this.port = port ?? 3000;
        
        this.app = express();
        this.app.use(express.json());
        this.app.use(cors());
        this.app.all("/mcp", this.handleMcpRequest.bind(this));
        this.setupServer = setupServerFunc;
    }
    async createMcpServer() {
        const server = new McpServer({
            name: this.name,
            version: this.version
        });
        await this.setupServer(server);
        return server;
    }
    async handleMcpRequest(req, res) {
        try {
            const server = await this.createMcpServer();
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined
            });

            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);

            res.on('close', () => {
                transport.close();
                server.close();
            });
        } catch (error) {
            console.error("Error handling MCP request:", error);
            res.status(500).send("Internal Server Error");
        }
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`MCP Server running at http://localhost:${this.port}/mcp`);
        });
    }
}