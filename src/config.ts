import { config } from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// .env 파일에서 환경 변수를 불러옴 (예: API 키나 포트 번호 같은 설정값)
config();

interface ServerConfig {
  unsplashApiKey: string; // Unsplash API 키를 저장
  port: number; // 서버가 사용할 포트 번호
  configSources: {
    unsplashApiKey: "cli" | "env"; // API 키가 어디서 왔는지 (명령줄 or 환경 변수)
    port: "cli" | "env" | "default"; // 포트 번호가 어디서 왔는지 (명령줄, 환경 변수, 기본값)
  };
}

// API 키를 가려서 보여주는 함수 (보안 때문에 끝 4자리만 보이게 함)
function maskApiKey(key: string): string {
  if (key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
}

interface CliArgs {
  "unsplash-api-key"?: string; // 명령줄에서 입력받을 Unsplash API 키
  port?: number; // 명령줄에서 입력받을 포트 번호
}

// 서버 설정을 가져오는 함수
export function getServerConfig(isStdioMode: boolean): ServerConfig {
  // 명령줄에서 입력받은 값들을 처리
  const argv = yargs(hideBin(process.argv))
    .options({
      "unsplash-api-key": {
        type: "string",
        description: "UnSplash API key", // Unsplash API 키 설명
      },
      port: {
        type: "number",
        description: "Port to run the server on", // 포트 번호 설명
      },
    })
    .help()
    .parseSync() as CliArgs;

  // 기본 설정값을 준비
  const config: ServerConfig = {
    unsplashApiKey: "",
    port: 3333, // 기본 포트 번호는 3333
    configSources: {
      unsplashApiKey: "env",
      port: "default",
    },
  };

  // Unsplash API 키 설정: 명령줄에서 입력했으면 그걸 사용, 없으면 환경 변수에서 가져옴
  if (argv["unsplash-api-key"]) {
    config.unsplashApiKey = argv["unsplash-api-key"];
    config.configSources.unsplashApiKey = "cli";
  } else if (process.env.UNSPLASH_API_KEY) {
    config.unsplashApiKey = process.env.UNSPLASH_API_KEY;
    config.configSources.unsplashApiKey = "env";
  }

  // 포트 번호 설정: 명령줄에서 입력했으면 그걸 사용, 없으면 환경 변수, 둘 다 없으면 기본값 3333
  if (argv.port) {
    config.port = argv.port;
    config.configSources.port = "cli";
  } else if (process.env.PORT) {
    config.port = parseInt(process.env.PORT, 10); // 문자열을 숫자로 변환
    config.configSources.port = "env";
  }

  // API 키가 없으면 오류 메시지를 띄우고 프로그램 종료
  if (!config.unsplashApiKey) {
    console.error("UNSPLASH_API_KEY는 필수입니다 (명령줄 --unsplash-api-key나 .env 파일로 제공해주세요)");
    process.exit(1);
  }

  // 설정값이 어디서 왔는지 로그로 출력 (stdio 모드가 아닐 때만)
  if (!isStdioMode) {
    console.log("\n설정 정보:");
    console.log(
      `- UNSPLASH_API_KEY: ${maskApiKey(config.unsplashApiKey)} (출처: ${config.configSources.unsplashApiKey})`,
    );
    console.log(`- PORT: ${config.port} (출처: ${config.configSources.port})`);
    console.log();
  }

  // 최종 설정값 반환
  return config;
}