// 필요한 도구들을 가져오는 부분 (라이브러리라고 생각하면 됨)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { IncomingMessage, ServerResponse } from "http";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

// 로그를 남기는 간단한 도구, 지금은 아무것도 안 하지만 나중에 메시지를 기록할 때 사용
export const Logger = {
  log: (...args: any[]) => {},
  error: (...args: any[]) => {},
};

// Unsplash 사진을 검색하는 서버를 만드는 클래스
export class UnsplashMcpServer {
  private readonly server: McpServer; // 서버를 관리하는 핵심 객체
  private readonly unsplashApiKey: string; // Unsplash에서 사진을 가져오기 위한 비밀 키
  private sseTransport: SSEServerTransport | null = null; // 실시간 연결을 관리하는 도구

  // 서버를 시작할 때 필요한 기본 설정을 하는 부분
  constructor(unsplashApiKey: string) {
    this.unsplashApiKey = unsplashApiKey;
    this.server = new McpServer(
      {
        name: "Unsplash MCP Server", // 서버 이름
        version: "0.0.1", // 서버 버전
      },
      {
        capabilities: {
          logging: {}, // 로그 기능
          tools: {}, // 도구 기능
        },
      },
    );

    this.registerTools(); // 사진 검색 기능을 서버에 추가
  }

  // 사진 검색 기능을 서버에 등록하는 부분
  private registerTools(): void {
    this.server.tool(
      "search_photo", // 도구 이름
      "The search_photos function retrieves images from Unsplash based on a given keyword. It sends a search request, fetches matching images, and returns relevant results with metadata. The resulting images can be accessed via the following links:\n\n[Image 1](image_url_1)\n[Image 2](image_url_2)\n[Image 3](image_url_3)\n...\n",
      {
        // 검색할 때 사용할 옵션들 (예: 키워드, 페이지 번호 등)
        query: z.string(), // 검색어
        page: z.number().optional(), // 페이지 번호 (선택)
        per_page: z.number().optional(), // 한 페이지에 보여줄 사진 수 (선택)
        order_by: z.enum(['latest', 'relevant']).optional(), // 정렬 방식 (선택)
        collections: z.string().optional(), // 특정 컬렉션 (선택)
        content_filter: z.enum(['low', 'high']).optional(), // 콘텐츠 필터 (선택)
        color: z.enum([
          'black_and_white', 'black', 'white', 'yellow', 'orange', 'red',
          'purple', 'magenta', 'green', 'teal', 'blue',
        ]).optional(), // 색상 필터 (선택)
        orientation: z.enum(['landscape', 'portrait', 'squarish']).optional(), // 사진 방향 (선택)
      },
      async (args) => {
        // 검색 옵션들을 받아오는 부분
        const {
          query,
          page = 1,
          per_page = 10,
          order_by = 'relevant',
          collections,
          content_filter = 'low',
          color,
          orientation,
        } = args;
        try {
          Logger.log(`Searching for photos with query: ${query}`); // 검색 시작 로그

          // Unsplash에 요청을 보내 사진을 가져오는 부분
          const response = await axios.get('https://api.unsplash.com/search/photos', {
            params: {
              query,
              page,
              per_page,
              order_by,
              content_filter,
              ...(collections && { collections }),
              ...(color && { color }),
              ...(orientation && { orientation }),
            },
            headers: {
              Authorization: `Client-ID ${this.unsplashApiKey}`, // 인증 키 추가
            },
          });
    
          // 가져온 사진 정보를 예쁘게 정리해서 반환
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          // 문제가 생기면 에러 메시지를 반환
          return {
            content: [{ type: "text", text: `Error fetching file: ${error}` }],
          };
        }
      },
    );
  }

  // 서버와 연결하는 부분
  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);

    // 로그를 남기는 방법을 업데이트
    Logger.log = (...args: any[]) => {
      this.server.server.sendLoggingMessage({
        level: "info",
        data: args,
      });
    };
    Logger.error = (...args: any[]) => {
      this.server.server.sendLoggingMessage({
        level: "error",
        data: args,
      });
    };

    Logger.log("Server connected and ready to process requests"); // 연결 완료 메시지
  }

  // HTTP 서버를 시작하는 부분
  async startHttpServer(port: number): Promise<void> {
    const app = express(); // 웹 서버를 만드는 도구

    // 실시간 연결(SSE)을 처리하는 경로
    app.get("/sse", async (req: Request, res: Response) => {
      console.log("New SSE connection established"); // 새 연결 알림
      this.sseTransport = new SSEServerTransport(
        "/messages",
        res as unknown as ServerResponse<IncomingMessage>,
      );
      await this.server.connect(this.sseTransport); // 서버와 연결
    });

    // 메시지를 받는 경로
    app.post("/messages", async (req: Request, res: Response) => {
      if (!this.sseTransport) {
        res.sendStatus(400); // 연결이 없으면 오류
        return;
      }
      await this.sseTransport.handlePostMessage(
        req as unknown as IncomingMessage,
        res as unknown as ServerResponse<IncomingMessage>,
      );
    });

    // 로그를 콘솔에 출력하도록 설정
    Logger.log = console.log;
    Logger.error = console.error;

    // 서버를 지정한 포트에서 실행
    app.listen(port, () => {
      Logger.log(`HTTP server listening on port ${port}`); // 서버 시작 알림
      Logger.log(`SSE endpoint available at http://localhost:${port}/sse`); // SSE 경로
      Logger.log(`Message endpoint available at http://localhost:${port}/messages`); // 메시지 경로
    });
  }
}