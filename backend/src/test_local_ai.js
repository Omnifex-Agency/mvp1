
import { handler } from './handlers/api.js';

async function test() {
    console.log("--- Testing Summary Generation ---");
    const summaryEvent = {
        httpMethod: "POST",
        path: "/generate/summary",
        body: JSON.stringify({
            text: "The Amazon rainforest, also known in English as Amazonia or the Amazon Jungle, is a moist broadleaf tropical rainforest in the Amazon biome that covers most of the Amazon basin of South America. This basin encompasses 7,000,000 square kilometers (2,700,000 sq mi), of which 5,500,000 square kilometers (2,100,000 sq mi) are covered by the rainforest. This region includes territory belonging to nine nations. The majority of the forest is contained within Brazil, with 60% of the rainforest, followed by Peru with 13%, Colombia with 10%, and with minor amounts in Venezuela, Ecuador, Bolivia, Guyana, Suriname and French Guiana."
        })
    };

    const startTime = Date.now();
    const summaryRes = await handler(summaryEvent);
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Duration: ${duration}s`);
    console.log("Status:", summaryRes.statusCode);
    if (summaryRes.body) {
        const body = JSON.parse(summaryRes.body);
        console.log("Summary:", body.summary ? body.summary : body);
    } else {
        console.log("No body returned");
    }

    console.log("\n--- Testing Quiz Generation ---");
    const quizEvent = {
        httpMethod: "POST",
        path: "/generate/quiz",
        body: JSON.stringify({
            text: "JavaScript is a programming language that is one of the core technologies of the World Wide Web, alongside HTML and CSS. As of 2022, 98% of websites use JavaScript on the client side for webpage behavior, often incorporating third-party libraries."
        })
    };

    const startQuizTime = Date.now();
    const quizRes = await handler(quizEvent);
    const quizDuration = (Date.now() - startQuizTime) / 1000;
    console.log(`Duration: ${quizDuration}s`);
    console.log("Status:", quizRes.statusCode);
    if (quizRes.body) {
        const body = JSON.parse(quizRes.body);
        console.log("Quiz:", body.quiz ? body.quiz : body);
    }
}

test();
