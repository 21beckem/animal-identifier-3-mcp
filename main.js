import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transports = {};


function createMcpServer() {
    const server = new McpServer({
        name: 'Google Drive',
        version: '1.0.0'
    });

    server.registerTool(
        'create_document',
        {
            description: 'creates a new document in Google Drive with the specified title and content',
            inputSchema: {
                title: z.string().describe('The title of the document to create'),
                content: z.string().describe('The content of the document to create')
            }
        },
        async ({ title, content }) => {
            return {
                content: [
                    {
                        type: 'text',
                        text: `I am a custom tool developed by Michael Becker. The document "${title}" was created with content: ${content}`
                    }
                ]
            };
        }
    );

    return server;
}

// create express
const app = createMcpExpressApp();
app.use(cors());

const handleMCPRequest = async (req, res) => {
    try {
        // 1. CREATE: A fresh server and a stateless transport are created.
        const server = createMcpServer();
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // CRITICAL: This enables stateless mode.
        });

        // 2. CONNECT & HANDLE: The ephemeral instances process the single request.
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);

        // 3. CLEANUP: Once the connection closes, we MUST destroy the instances.
        res.on('close', () => {
            transport.close();
            server.close(); // This prevents memory leaks.
        });
    } catch (error) {
        // ... global error handling ...
        console.error("Error handling MCP request:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Handle GET requests for server-to-client notifications via SSE
app.all("/mcp", handleMCPRequest);



app.listen(3000, () => {
    console.log("MCP Server running at http://localhost:3000/mcp");
});