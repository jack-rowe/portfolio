import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const abbrev = searchParams.get("abbrev")?.toUpperCase();
    if (!abbrev) {
      return Response.json(
        { message: "Missing required query parameter 'abbrev'" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/20252026`
    );
    const data = await response.json();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const relevantGame = data.games.find(
      (game: { gameDate: string | number | Date; gameState: string }) => {
        const gameDate = new Date(game.gameDate);
        gameDate.setUTCHours(0, 0, 0, 0);
        if (gameDate.getTime() === today.getTime()) return true;
        if (game.gameState === "FUT" && gameDate > today) return true;
        return false;
      }
    );

    if (!relevantGame) {
      return Response.json(
        { message: "No upcoming games found" },
        { status: 404 }
      );
    }

    // Format time to Eastern Time
    const utcDate = new Date(relevantGame.startTimeUTC);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short",
    });
    const estDateTime = formatter.format(utcDate).replace(", ", " ");

    const filteredGame = {
      homeTeam: relevantGame.homeTeam.abbrev,
      awayTeam: relevantGame.awayTeam.abbrev,
      startTimeEST: estDateTime,
      hasStarted:
        relevantGame.gameState === "LIVE" || relevantGame.gameState === "FINAL",
    };

    return Response.json({ game: filteredGame }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching game data", error: error },
      { status: 500 }
    );
  }
}
