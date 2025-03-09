import { NextRequest } from "next/server";

// Define types for the API response
interface TeamInfo {
  default: string;
  fr?: string;
}

interface StandingsTeam {
  conferenceAbbrev: string;
  conferenceName: string;
  divisionName: string;
  divisionSequence: number;
  gamesPlayed: number;
  goalDifferential: number;
  points: number;
  wins: number;
  losses: number;
  otLosses: number;
  regulationWins: number;
  teamAbbrev: TeamInfo;
  teamName: TeamInfo;
  teamCommonName: TeamInfo;
}

interface StandingsResponse {
  wildCardIndicator: boolean;
  standingsDateTimeUtc: string;
  standings: StandingsTeam[];
}

// Response types
interface SimplifiedTeam {
  teamAbbrev: string;
  teamName: string;
  gamesPlayed: number;
  points: number;
  wins: number;
  losses: number;
  otLosses: number;
  goalDifferential: number;
  isCurrentTeam: boolean;
}

interface DivisionTeam extends SimplifiedTeam {
  divisionRank: number;
}

interface WildcardTeam extends SimplifiedTeam {
  wildcardRank: number;
  pointsFromPlayoffSpot: number;
  inPlayoffPosition: boolean;
}

interface TeamResponse {
  abbrev: string;
  name: string;
  conference: string;
  division: string;
  playoffStatus: string;
}

interface StandingsResult {
  team: TeamResponse;
  divisionStandings: DivisionTeam[];
  wildcardStandings: WildcardTeam[];
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const abbrev = searchParams.get("abbrev")?.toUpperCase();
    if (!abbrev) {
      return Response.json(
        { message: "Missing required query parameter 'abbrev'" },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api-web.nhle.com/v1/standings/now`);
    const data: StandingsResponse = await response.json();

    // Find the team and get division and conference info
    const teamData = data.standings.find(
      (team) => team.teamAbbrev.default === abbrev
    );
    if (!teamData) {
      return Response.json(
        { message: `Team with abbreviation '${abbrev}' not found` },
        { status: 404 }
      );
    }

    const divisionName = teamData.divisionName;
    const conferenceName = teamData.conferenceName;

    // Get division standings
    const divisionStandings: DivisionTeam[] = data.standings
      .filter((team) => team.divisionName === divisionName)
      .sort((a, b) => b.points - a.points)
      .map((team) => ({
        teamAbbrev: team.teamAbbrev.default,
        teamName: team.teamName.default,
        divisionRank: team.divisionSequence,
        gamesPlayed: team.gamesPlayed,
        points: team.points,
        wins: team.wins,
        losses: team.losses,
        otLosses: team.otLosses,
        goalDifferential: team.goalDifferential,
        isCurrentTeam: team.teamAbbrev.default === abbrev,
      }));

    // Get all teams from the conference
    const conferenceTeams = data.standings
      .filter((team) => team.conferenceName === conferenceName)
      .sort((a, b) => b.points - a.points);

    // Get the top 3 teams from each division in the conference
    const divisionLeaders = conferenceTeams.filter(
      (team) => team.divisionSequence <= 3
    );

    // Get wild card teams (not in top 3 of their division)
    const wildcardTeams: WildcardTeam[] = conferenceTeams
      .filter((team) => team.divisionSequence > 3)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        // If points are tied, use regulation wins as tiebreaker
        return b.regulationWins - a.regulationWins;
      })
      .slice(0, 5) // Get top 5 teams (2 wildcard spots + 3 more for context)
      .map((team, index) => ({
        teamAbbrev: team.teamAbbrev.default,
        teamName: team.teamName.default,
        wildcardRank: index + 1,
        gamesPlayed: team.gamesPlayed,
        points: team.points,
        wins: team.wins,
        losses: team.losses,
        otLosses: team.otLosses,
        goalDifferential: team.goalDifferential,
        pointsFromPlayoffSpot:
          index >= 2
            ? conferenceTeams.filter((t) => t.divisionSequence > 3)[1]?.points -
              team.points
            : 0,
        isCurrentTeam: team.teamAbbrev.default === abbrev,
        inPlayoffPosition: index < 2,
      }));

    // Check if the current team is in the division leaders
    const isTeamInDivisionLeaders = divisionLeaders.some(
      (team) => team.teamAbbrev.default === abbrev
    );

    // Check if the current team is in wildcard position
    const isTeamInWildcard = wildcardTeams
      .slice(0, 2)
      .some((team) => team.teamAbbrev === abbrev);

    // Determine playoff status
    let playoffStatus = "Out of Playoffs";
    if (isTeamInDivisionLeaders) {
      playoffStatus = "Division Playoff Spot";
    } else if (isTeamInWildcard) {
      playoffStatus = "Wild Card";
    }

    // Create the final response object
    const result: StandingsResult = {
      team: {
        abbrev: teamData.teamAbbrev.default,
        name: teamData.teamName.default,
        conference: conferenceName,
        division: divisionName,
        playoffStatus,
      },
      divisionStandings,
      wildcardStandings: wildcardTeams,
    };

    return Response.json(result);
  } catch (error) {
    console.error("Error in standings route:", error);
    return Response.json(
      { message: "Error fetching standings data", error: String(error) },
      { status: 500 }
    );
  }
}
