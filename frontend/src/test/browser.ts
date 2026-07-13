import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

const handlers = [
  http.get("/api/v1/public/stats", () => {
    return HttpResponse.json({
      success: true,
      message: "Stats retrieved",
      data: {
        activeStudents: 1240,
        coursesOffered: 86,
        aiQueriesAnswered: 15300,
      },
      timestamp: new Date().toISOString(),
    });
  }),
];

export const worker = setupWorker(...handlers);
