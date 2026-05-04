const fs = require('fs');
const path = require('path');

// 파일 경로 설정
const diffPath = path.join(__dirname, '../diff.txt');
const apiDocsPath = path.join(__dirname, '../02_api_routes.md');
const uiDocsPath = path.join(__dirname, '../03_frontend_ui.md');

async function runAutoSync() {
  try {
    // 1. 파일 읽기 (diff가 없으면 종료)
    if (!fs.existsSync(diffPath)) {
      console.log('diff.txt 파일이 없습니다. 변경 사항이 없으므로 종료합니다.');
      return;
    }
    
    const diffContent = fs.readFileSync(diffPath, 'utf-8');
    if (!diffContent.trim()) {
      console.log('코드 변경 사항(diff)이 없습니다.');
      return;
    }

    const apiDocsContent = fs.existsSync(apiDocsPath) ? fs.readFileSync(apiDocsPath, 'utf-8') : '';
    const uiDocsContent = fs.existsSync(uiDocsPath) ? fs.readFileSync(uiDocsPath, 'utf-8') : '';

    // 2. LLM API 호출 (OpenAI 기준 예시, 사용하는 LLM에 맞춰 URL/Model 수정 필요)
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('AI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }

    const prompt = `
    너는 팩토리 파이프라인의 문서 관리 봇이다. 
    다음 제공되는 소스 코드 변경 내역(git diff)을 분석하고, 기존 '02_api_routes.md'와 '03_frontend_ui.md'를 최신 스펙으로 갱신하라. 
    임의의 코드를 작성하지 말고 오직 마크다운(.md) 포맷으로만 결과를 출력하라.
    응답은 반드시 아래 JSON 포맷으로만 반환하라.
    {
      "api_routes_md": "업데이트된 02_api_routes.md 내용 전체",
      "frontend_ui_md": "업데이트된 03_frontend_ui.md 내용 전체"
    }

    [Git Diff]
    ${diffContent}

    [Current 02_api_routes.md]
    ${apiDocsContent}

    [Current 03_frontend_ui.md]
    ${uiDocsContent}
    `;

    console.log('LLM에게 문서 업데이트를 요청 중입니다...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // 또는 gpt-4-turbo 등
        messages: [{ role: 'system', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('LLM 응답을 파싱할 수 없습니다.');
    }

    // 3. 응답 파싱 및 파일 덮어쓰기
    const updatedDocs = JSON.parse(data.choices[0].message.content);

    if (updatedDocs.api_routes_md) {
      fs.writeFileSync(apiDocsPath, updatedDocs.api_routes_md, 'utf-8');
      console.log('✅ 02_api_routes.md 업데이트 완료');
    }
    
    if (updatedDocs.frontend_ui_md) {
      fs.writeFileSync(uiDocsPath, updatedDocs.frontend_ui_md, 'utf-8');
      console.log('✅ 03_frontend_ui.md 업데이트 완료');
    }

  } catch (error) {
    console.error('❌ 역동기화 실패:', error.message);
    process.exit(1);
  }
}

runAutoSync();