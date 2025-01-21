export const dynamic = "force-dynamic"; // This ensures we get fresh data
export async function GET(request: { url: string | URL }) {
  try {
    // Get the abbrev from query parameters
    const { searchParams } = new URL(request.url);
    const abbrev = searchParams.get("abbrev")?.toUpperCase();

    if (!abbrev) {
      return Response.json(
        { message: "Missing required query parameter 'abbrev'" },
        { status: 400 }
      );
    }

    // Fetch data from NHL API
    const response = await fetch(
      `https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/20242025`
    );
    const data = await response.json();

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find today's game or next future game
    const relevantGame = data.games.find(
      (game: { gameDate: string | number | Date; gameState: string }) => {
        const gameDate = new Date(game.gameDate);
        gameDate.setUTCHours(0, 0, 0, 0);

        // First check for today's game
        if (gameDate.getTime() === today.getTime()) {
          return true;
        }

        // Then check for future games if no game today
        if (game.gameState === "FUT" && gameDate > today) {
          return true;
        }

        return false;
      }
    );

    // only return the homeTeam, awayTeam, and startTimeUTC
    const filteredGame = relevantGame
      ? {
          homeTeam: relevantGame.homeTeam.abbrev,
          awayTeam: relevantGame.awayTeam.abbrev,
          startTimeUTC: relevantGame.startTimeUTC,
          hasStarted:
            relevantGame.gameState === "LIVE" ||
            relevantGame.gameState === "FINAL",
        }
      : undefined;

    if (!filteredGame) {
      return Response.json(
        { message: "No upcoming games found" },
        { status: 404 }
      );
    }

    return Response.json({ game: filteredGame }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching game data", error: error },
      { status: 500 }
    );
  }
}
