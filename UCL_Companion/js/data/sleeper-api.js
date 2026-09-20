const SLEEPER_API='https://api.sleeper.app/v1';
const SLEEPER_PROJECTIONS_API='https://api.sleeper.app/projections/nfl';
let week1ProjectionData=null,week1ProjectionSyncPromise=null,week1ProjectionError='';
let currentWeekProjectionData=null,currentWeekProjectionWeek=0,currentWeekProjectionSyncPromise=null,currentWeekProjectionError='';
const weekProjectionMaps=new Map(),weekProjectionSyncPromises=new Map();
let selectedSeasonWeek=null,seasonWeekSelectionBusy=false;
let selectedTeamWeek=null,teamWeekSelectionBusy=false;
const SLEEPER_SEASON='2026';
const SLEEPER_LEAGUE_ID='1386066375474180096';
const SLEEPER_USERS=['dmercado','ChiefJuannataco','MadRagin','karebear','fograw','mgarcia49','brianbrianrbianbrina','Ntsuas'];
const NFL_TEAM_BYE_WEEKS_2026=Object.freeze({
  ARI:14,ATL:11,BAL:13,BUF:7,CAR:5,CHI:10,CIN:6,CLE:11,
  DAL:14,DEN:10,DET:6,GB:11,HOU:8,IND:13,JAX:7,KC:5,
  LV:13,LAC:7,LAR:11,MIA:6,MIN:6,NE:11,NO:8,NYG:8,
  NYJ:13,PHI:10,PIT:9,SF:8,SEA:11,TB:10,TEN:9,WAS:7
});
function nflTeamByeWeek(team){
  const t=String(team||'').toUpperCase().trim();
  const aliases={AZ:'ARI',JAC:'JAX',WSH:'WAS'};
  return NFL_TEAM_BYE_WEEKS_2026[aliases[t]||t]??null;
}


const UCL_NFL_SCHEDULE_2026=Object.freeze([
  [1,"2026-09-10T00:20:00Z","SEA","NE","Lumen Field"],
  [1,"2026-09-11T00:35:00Z","LAR","SF","Melbourne Cricket Ground"],
  [1,"2026-09-13T17:00:00Z","CAR","CHI","Bank of America Stadium"],
  [1,"2026-09-13T17:00:00Z","CIN","TB","Paycor Stadium"],
  [1,"2026-09-13T17:00:00Z","DET","NO","Ford Field"],
  [1,"2026-09-13T17:00:00Z","HOU","BUF","Reliant Stadium"],
  [1,"2026-09-13T17:00:00Z","IND","BAL","Lucas Oil Stadium"],
  [1,"2026-09-13T17:00:00Z","JAX","CLE","EverBank Stadium"],
  [1,"2026-09-13T17:00:00Z","PIT","ATL","Acrisure Stadium"],
  [1,"2026-09-13T17:00:00Z","TEN","NYJ","Nissan Stadium"],
  [1,"2026-09-13T20:25:00Z","LAC","ARI","SoFi Stadium"],
  [1,"2026-09-13T20:25:00Z","LV","MIA","Allegiant Stadium"],
  [1,"2026-09-13T20:25:00Z","MIN","GB","U.S. Bank Stadium"],
  [1,"2026-09-13T20:25:00Z","PHI","WAS","Lincoln Financial Field"],
  [1,"2026-09-14T00:20:00Z","NYG","DAL","MetLife Stadium"],
  [1,"2026-09-15T00:15:00Z","KC","DEN","Arrowhead Stadium"],
  [2,"2026-09-18T00:15:00Z","BUF","DET","Highmark Stadium"],
  [2,"2026-09-20T17:00:00Z","ATL","CAR","Mercedes-Benz Stadium"],
  [2,"2026-09-20T17:00:00Z","BAL","NO","M&T Bank Stadium"],
  [2,"2026-09-20T17:00:00Z","CHI","MIN","Soldier Field"],
  [2,"2026-09-20T17:00:00Z","HOU","CIN","Reliant Stadium"],
  [2,"2026-09-20T17:00:00Z","NE","PIT","Gillette Stadium"],
  [2,"2026-09-20T17:00:00Z","NYJ","GB","MetLife Stadium"],
  [2,"2026-09-20T17:00:00Z","TB","CLE","Raymond James Stadium"],
  [2,"2026-09-20T17:00:00Z","TEN","PHI","Nissan Stadium"],
  [2,"2026-09-20T20:05:00Z","DEN","JAX","Empower Field at Mile High"],
  [2,"2026-09-20T20:05:00Z","LAC","LV","SoFi Stadium"],
  [2,"2026-09-20T20:25:00Z","ARI","SEA","State Farm Stadium"],
  [2,"2026-09-20T20:25:00Z","DAL","WAS","AT&T Stadium"],
  [2,"2026-09-20T20:25:00Z","SF","MIA","Levi's\u00ae Stadium"],
  [2,"2026-09-21T00:20:00Z","KC","IND","Arrowhead Stadium"],
  [2,"2026-09-22T00:15:00Z","LAR","NYG","SoFi Stadium"],
  [3,"2026-09-25T00:15:00Z","GB","ATL","Lambeau Field"],
  [3,"2026-09-27T17:00:00Z","BUF","LAC","Highmark Stadium"],
  [3,"2026-09-27T17:00:00Z","CLE","CAR","Huntington Bank Field"],
  [3,"2026-09-27T17:00:00Z","DET","NYJ","Ford Field"],
  [3,"2026-09-27T17:00:00Z","IND","HOU","Lucas Oil Stadium"],
  [3,"2026-09-27T17:00:00Z","JAX","NE","EverBank Stadium"],
  [3,"2026-09-27T17:00:00Z","MIA","KC","Hard Rock Stadium"],
  [3,"2026-09-27T17:00:00Z","NYG","TEN","MetLife Stadium"],
  [3,"2026-09-27T17:00:00Z","PIT","CIN","Acrisure Stadium"],
  [3,"2026-09-27T17:00:00Z","WAS","SEA","Northwest Stadium"],
  [3,"2026-09-27T20:05:00Z","SF","ARI","Levi's\u00ae Stadium"],
  [3,"2026-09-27T20:05:00Z","TB","MIN","Raymond James Stadium"],
  [3,"2026-09-27T20:25:00Z","DAL","BAL","Maracana Stadium"],
  [3,"2026-09-27T20:25:00Z","NO","LV","Caesars Superdome"],
  [3,"2026-09-28T00:20:00Z","DEN","LAR","Empower Field at Mile High"],
  [3,"2026-09-29T00:15:00Z","CHI","PHI","Soldier Field"],
  [4,"2026-10-02T00:15:00Z","CLE","PIT","Huntington Bank Field"],
  [4,"2026-10-04T13:30:00Z","WAS","IND","Tottenham Hotspur Stadium"],
  [4,"2026-10-04T17:00:00Z","BAL","TEN","M&T Bank Stadium"],
  [4,"2026-10-04T17:00:00Z","BUF","NE","Highmark Stadium"],
  [4,"2026-10-04T17:00:00Z","CHI","NYJ","Soldier Field"],
  [4,"2026-10-04T17:00:00Z","CIN","JAX","Paycor Stadium"],
  [4,"2026-10-04T17:00:00Z","HOU","DAL","Reliant Stadium"],
  [4,"2026-10-04T17:00:00Z","NYG","ARI","MetLife Stadium"],
  [4,"2026-10-04T17:00:00Z","PHI","LAR","Lincoln Financial Field"],
  [4,"2026-10-04T17:00:00Z","TB","GB","Raymond James Stadium"],
  [4,"2026-10-04T20:05:00Z","MIN","MIA","U.S. Bank Stadium"],
  [4,"2026-10-04T20:25:00Z","LV","KC","Allegiant Stadium"],
  [4,"2026-10-04T20:25:00Z","SEA","LAC","Lumen Field"],
  [4,"2026-10-04T20:25:00Z","SF","DEN","Levi's\u00ae Stadium"],
  [4,"2026-10-05T00:20:00Z","CAR","DET","Bank of America Stadium"],
  [4,"2026-10-06T00:15:00Z","NO","ATL","Caesars Superdome"],
  [5,"2026-10-09T00:15:00Z","DAL","TB","AT&T Stadium"],
  [5,"2026-10-11T13:30:00Z","JAX","PHI","Tottenham Hotspur Stadium"],
  [5,"2026-10-11T17:00:00Z","MIA","CIN","Hard Rock Stadium"],
  [5,"2026-10-11T17:00:00Z","NE","LV","Gillette Stadium"],
  [5,"2026-10-11T17:00:00Z","NO","MIN","Caesars Superdome"],
  [5,"2026-10-11T17:00:00Z","NYJ","CLE","MetLife Stadium"],
  [5,"2026-10-11T17:00:00Z","PIT","IND","Acrisure Stadium"],
  [5,"2026-10-11T17:00:00Z","TEN","HOU","Nissan Stadium"],
  [5,"2026-10-11T17:00:00Z","WAS","NYG","Northwest Stadium"],
  [5,"2026-10-11T20:05:00Z","LAC","DEN","SoFi Stadium"],
  [5,"2026-10-11T20:25:00Z","ARI","DET","State Farm Stadium"],
  [5,"2026-10-11T20:25:00Z","GB","CHI","Lambeau Field"],
  [5,"2026-10-11T20:25:00Z","SEA","SF","Lumen Field"],
  [5,"2026-10-12T00:20:00Z","ATL","BAL","Mercedes-Benz Stadium"],
  [5,"2026-10-13T00:15:00Z","LAR","BUF","SoFi Stadium"],
  [6,"2026-10-16T00:15:00Z","DEN","SEA","Empower Field at Mile High"],
  [6,"2026-10-18T13:30:00Z","JAX","HOU","Wembley Stadium"],
  [6,"2026-10-18T17:00:00Z","ATL","CHI","Mercedes-Benz Stadium"],
  [6,"2026-10-18T17:00:00Z","CLE","BAL","Huntington Bank Field"],
  [6,"2026-10-18T17:00:00Z","IND","TEN","Lucas Oil Stadium"],
  [6,"2026-10-18T17:00:00Z","NE","NYJ","Gillette Stadium"],
  [6,"2026-10-18T17:00:00Z","NYG","NO","MetLife Stadium"],
  [6,"2026-10-18T17:00:00Z","PHI","CAR","Lincoln Financial Field"],
  [6,"2026-10-18T17:00:00Z","TB","PIT","Raymond James Stadium"],
  [6,"2026-10-18T20:05:00Z","LAR","ARI","SoFi Stadium"],
  [6,"2026-10-18T20:25:00Z","KC","LAC","Arrowhead Stadium"],
  [6,"2026-10-18T20:25:00Z","LV","BUF","Allegiant Stadium"],
  [6,"2026-10-19T00:20:00Z","GB","DAL","Lambeau Field"],
  [6,"2026-10-20T00:15:00Z","SF","WAS","Levi's\u00ae Stadium"],
  [7,"2026-10-23T00:15:00Z","CHI","NE","Soldier Field"],
  [7,"2026-10-25T13:30:00Z","NO","PIT","Stade de France"],
  [7,"2026-10-25T17:00:00Z","ATL","SF","Mercedes-Benz Stadium"],
  [7,"2026-10-25T17:00:00Z","BAL","CIN","M&T Bank Stadium"],
  [7,"2026-10-25T17:00:00Z","CAR","TB","Bank of America Stadium"],
  [7,"2026-10-25T17:00:00Z","HOU","NYG","Reliant Stadium"],
  [7,"2026-10-25T17:00:00Z","MIN","IND","U.S. Bank Stadium"],
  [7,"2026-10-25T17:00:00Z","NYJ","MIA","MetLife Stadium"],
  [7,"2026-10-25T17:00:00Z","TEN","CLE","Nissan Stadium"],
  [7,"2026-10-25T20:05:00Z","ARI","DEN","State Farm Stadium"],
  [7,"2026-10-25T20:25:00Z","DET","GB","Ford Field"],
  [7,"2026-10-25T20:25:00Z","LV","LAR","Allegiant Stadium"],
  [7,"2026-10-26T00:20:00Z","SEA","KC","Lumen Field"],
  [7,"2026-10-27T00:15:00Z","PHI","DAL","Lincoln Financial Field"],
  [8,"2026-10-30T00:15:00Z","GB","CAR","Lambeau Field"],
  [8,"2026-11-01T18:00:00Z","BUF","BAL","Highmark Stadium"],
  [8,"2026-11-01T18:00:00Z","CIN","TEN","Paycor Stadium"],
  [8,"2026-11-01T18:00:00Z","DAL","ARI","AT&T Stadium"],
  [8,"2026-11-01T18:00:00Z","DET","MIN","Ford Field"],
  [8,"2026-11-01T18:00:00Z","JAX","IND","EverBank Stadium"],
  [8,"2026-11-01T18:00:00Z","NYJ","LV","MetLife Stadium"],
  [8,"2026-11-01T18:00:00Z","PIT","CLE","Acrisure Stadium"],
  [8,"2026-11-01T18:00:00Z","TB","ATL","Raymond James Stadium"],
  [8,"2026-11-01T21:05:00Z","LAR","LAC","SoFi Stadium"],
  [8,"2026-11-01T21:25:00Z","DEN","KC","Empower Field at Mile High"],
  [8,"2026-11-01T21:25:00Z","MIA","NE","Hard Rock Stadium"],
  [8,"2026-11-02T01:20:00Z","WAS","PHI","Northwest Stadium"],
  [8,"2026-11-03T01:15:00Z","SEA","CHI","Lumen Field"],
  [9,"2026-11-06T01:15:00Z","BAL","JAX","M&T Bank Stadium"],
  [9,"2026-11-08T14:30:00Z","ATL","CIN","Bernabeu"],
  [9,"2026-11-08T18:00:00Z","CAR","DEN","Bank of America Stadium"],
  [9,"2026-11-08T18:00:00Z","IND","DAL","Lucas Oil Stadium"],
  [9,"2026-11-08T18:00:00Z","KC","NYJ","Arrowhead Stadium"],
  [9,"2026-11-08T18:00:00Z","MIA","DET","Hard Rock Stadium"],
  [9,"2026-11-08T18:00:00Z","NO","CLE","Caesars Superdome"],
  [9,"2026-11-08T18:00:00Z","PHI","NYG","Lincoln Financial Field"],
  [9,"2026-11-08T18:00:00Z","WAS","LAR","Northwest Stadium"],
  [9,"2026-11-08T21:05:00Z","LAC","HOU","SoFi Stadium"],
  [9,"2026-11-08T21:05:00Z","SF","LV","Levi's\u00ae Stadium"],
  [9,"2026-11-08T21:25:00Z","NE","GB","Gillette Stadium"],
  [9,"2026-11-08T21:25:00Z","SEA","ARI","Lumen Field"],
  [9,"2026-11-09T01:20:00Z","CHI","TB","Soldier Field"],
  [9,"2026-11-10T01:15:00Z","MIN","BUF","U.S. Bank Stadium"],
  [10,"2026-11-13T01:15:00Z","NYG","WAS","MetLife Stadium"],
  [10,"2026-11-15T14:30:00Z","DET","NE","FC Bayern Munich Stadium"],
  [10,"2026-11-15T18:00:00Z","ATL","KC","Mercedes-Benz Stadium"],
  [10,"2026-11-15T18:00:00Z","CLE","HOU","Huntington Bank Field"],
  [10,"2026-11-15T18:00:00Z","GB","MIN","Lambeau Field"],
  [10,"2026-11-15T18:00:00Z","IND","MIA","Lucas Oil Stadium"],
  [10,"2026-11-15T18:00:00Z","NO","CAR","Caesars Superdome"],
  [10,"2026-11-15T18:00:00Z","NYJ","BUF","MetLife Stadium"],
  [10,"2026-11-15T18:00:00Z","TEN","JAX","Nissan Stadium"],
  [10,"2026-11-15T21:05:00Z","ARI","LAR","State Farm Stadium"],
  [10,"2026-11-15T21:05:00Z","LV","SEA","Allegiant Stadium"],
  [10,"2026-11-15T21:25:00Z","DAL","SF","AT&T Stadium"],
  [10,"2026-11-16T01:20:00Z","CIN","PIT","Paycor Stadium"],
  [10,"2026-11-17T01:15:00Z","BAL","LAC","M&T Bank Stadium"],
  [11,"2026-11-20T01:15:00Z","HOU","IND","Reliant Stadium"],
  [11,"2026-11-22T18:00:00Z","BUF","MIA","Highmark Stadium"],
  [11,"2026-11-22T18:00:00Z","CAR","BAL","Bank of America Stadium"],
  [11,"2026-11-22T18:00:00Z","CHI","NO","Soldier Field"],
  [11,"2026-11-22T18:00:00Z","DAL","TEN","AT&T Stadium"],
  [11,"2026-11-22T18:00:00Z","DET","TB","Ford Field"],
  [11,"2026-11-22T18:00:00Z","KC","ARI","Arrowhead Stadium"],
  [11,"2026-11-22T18:00:00Z","NYG","JAX","MetLife Stadium"],
  [11,"2026-11-22T21:05:00Z","LAC","NYJ","SoFi Stadium"],
  [11,"2026-11-22T21:25:00Z","DEN","LV","Empower Field at Mile High"],
  [11,"2026-11-22T21:25:00Z","PHI","PIT","Lincoln Financial Field"],
  [11,"2026-11-23T01:20:00Z","SF","MIN","Estadio Banorte"],
  [11,"2026-11-24T01:15:00Z","WAS","CIN","Northwest Stadium"],
  [12,"2026-11-26T01:00:00Z","LAR","GB","SoFi Stadium"],
  [12,"2026-11-26T18:00:00Z","DET","CHI","Ford Field"],
  [12,"2026-11-26T21:30:00Z","DAL","PHI","AT&T Stadium"],
  [12,"2026-11-27T01:20:00Z","BUF","KC","Highmark Stadium"],
  [12,"2026-11-27T20:00:00Z","PIT","DEN","Acrisure Stadium"],
  [12,"2026-11-29T18:00:00Z","CIN","NO","Paycor Stadium"],
  [12,"2026-11-29T18:00:00Z","CLE","LV","Huntington Bank Field"],
  [12,"2026-11-29T18:00:00Z","HOU","BAL","Reliant Stadium"],
  [12,"2026-11-29T18:00:00Z","IND","NYG","Lucas Oil Stadium"],
  [12,"2026-11-29T18:00:00Z","MIA","NYJ","Hard Rock Stadium"],
  [12,"2026-11-29T18:00:00Z","MIN","ATL","U.S. Bank Stadium"],
  [12,"2026-11-29T21:05:00Z","JAX","TEN","EverBank Stadium"],
  [12,"2026-11-29T21:25:00Z","ARI","WAS","State Farm Stadium"],
  [12,"2026-11-29T21:25:00Z","SF","SEA","Levi's\u00ae Stadium"],
  [12,"2026-11-30T01:20:00Z","LAC","NE","SoFi Stadium"],
  [12,"2026-12-01T01:15:00Z","TB","CAR","Raymond James Stadium"],
  [13,"2026-12-04T01:15:00Z","LAR","KC","SoFi Stadium"],
  [13,"2026-12-06T18:00:00Z","ATL","DET","Mercedes-Benz Stadium"],
  [13,"2026-12-06T18:00:00Z","CHI","JAX","Soldier Field"],
  [13,"2026-12-06T18:00:00Z","CLE","CIN","Huntington Bank Field"],
  [13,"2026-12-06T18:00:00Z","NO","GB","Caesars Superdome"],
  [13,"2026-12-06T18:00:00Z","NYG","SF","MetLife Stadium"],
  [13,"2026-12-06T18:00:00Z","TB","LAC","Raymond James Stadium"],
  [13,"2026-12-06T18:00:00Z","TEN","WAS","Nissan Stadium"],
  [13,"2026-12-06T21:05:00Z","ARI","PHI","State Farm Stadium"],
  [13,"2026-12-06T21:05:00Z","DEN","MIA","Empower Field at Mile High"],
  [13,"2026-12-06T21:25:00Z","MIN","CAR","U.S. Bank Stadium"],
  [13,"2026-12-06T21:25:00Z","NE","BUF","Gillette Stadium"],
  [13,"2026-12-07T01:20:00Z","PIT","HOU","Acrisure Stadium"],
  [13,"2026-12-08T01:15:00Z","SEA","DAL","Lumen Field"],
  [14,"2026-12-11T01:15:00Z","NE","MIN","Gillette Stadium"],
  [14,"2026-12-13T18:00:00Z","BAL","TB","M&T Bank Stadium"],
  [14,"2026-12-13T18:00:00Z","CAR","NO","Bank of America Stadium"],
  [14,"2026-12-13T18:00:00Z","CLE","ATL","Huntington Bank Field"],
  [14,"2026-12-13T18:00:00Z","DET","TEN","Ford Field"],
  [14,"2026-12-13T18:00:00Z","MIA","CHI","Hard Rock Stadium"],
  [14,"2026-12-13T18:00:00Z","NYJ","DEN","MetLife Stadium"],
  [14,"2026-12-13T18:00:00Z","PHI","IND","Lincoln Financial Field"],
  [14,"2026-12-13T18:00:00Z","WAS","HOU","Northwest Stadium"],
  [14,"2026-12-13T21:05:00Z","LV","LAC","Allegiant Stadium"],
  [14,"2026-12-13T21:25:00Z","CIN","KC","Paycor Stadium"],
  [14,"2026-12-13T21:25:00Z","SEA","NYG","Lumen Field"],
  [14,"2026-12-13T21:25:00Z","SF","LAR","Levi's\u00ae Stadium"],
  [14,"2026-12-14T01:20:00Z","GB","BUF","Lambeau Field"],
  [14,"2026-12-15T01:15:00Z","JAX","PIT","EverBank Stadium"],
  [15,"2026-12-18T01:15:00Z","LAC","SF","SoFi Stadium"],
  [15,"2026-12-19T22:00:00Z","PHI","SEA","Lincoln Financial Field"],
  [15,"2026-12-20T01:20:00Z","BUF","CHI","Highmark Stadium"],
  [15,"2026-12-20T18:00:00Z","CAR","CIN","Bank of America Stadium"],
  [15,"2026-12-20T18:00:00Z","GB","MIA","Lambeau Field"],
  [15,"2026-12-20T18:00:00Z","HOU","JAX","Reliant Stadium"],
  [15,"2026-12-20T18:00:00Z","NYG","CLE","MetLife Stadium"],
  [15,"2026-12-20T18:00:00Z","PIT","BAL","Acrisure Stadium"],
  [15,"2026-12-20T18:00:00Z","TB","NO","Raymond James Stadium"],
  [15,"2026-12-20T18:00:00Z","TEN","IND","Nissan Stadium"],
  [15,"2026-12-20T18:00:00Z","WAS","ATL","Northwest Stadium"],
  [15,"2026-12-20T21:05:00Z","ARI","NYJ","State Farm Stadium"],
  [15,"2026-12-20T21:25:00Z","LAR","DAL","SoFi Stadium"],
  [15,"2026-12-20T21:25:00Z","LV","DEN","Allegiant Stadium"],
  [15,"2026-12-21T01:20:00Z","MIN","DET","U.S. Bank Stadium"],
  [15,"2026-12-22T01:15:00Z","KC","NE","Arrowhead Stadium"],
  [16,"2026-12-25T01:15:00Z","PHI","HOU","Lincoln Financial Field"],
  [16,"2026-12-25T18:00:00Z","CHI","GB","Soldier Field"],
  [16,"2026-12-25T21:30:00Z","DEN","BUF","Empower Field at Mile High"],
  [16,"2026-12-26T01:15:00Z","SEA","LAR","Lumen Field"],
  [16,"2026-12-27T18:00:00Z","BAL","CLE","M&T Bank Stadium"],
  [16,"2026-12-27T18:00:00Z","MIA","LAC","Hard Rock Stadium"],
  [16,"2026-12-27T18:00:00Z","NO","ARI","Caesars Superdome"],
  [16,"2026-12-27T18:00:00Z","NYJ","NE","MetLife Stadium"],
  [16,"2026-12-27T21:05:00Z","LV","TEN","Allegiant Stadium"],
  [16,"2026-12-27T21:25:00Z","KC","SF","Arrowhead Stadium"],
  [16,"2026-12-28T01:20:00Z","DAL","JAX","AT&T Stadium"],
  [16,"2026-12-29T00:00:00Z","ATL","TB","Mercedes-Benz Stadium"],
  [16,"2026-12-29T00:00:00Z","IND","CIN","Lucas Oil Stadium"],
  [16,"2026-12-29T00:00:00Z","MIN","WAS","U.S. Bank Stadium"],
  [16,"2026-12-29T00:00:00Z","PIT","CAR","Acrisure Stadium"],
  [16,"2026-12-29T01:15:00Z","DET","NYG","Ford Field"],
  [17,"2027-01-01T01:15:00Z","CIN","BAL","Paycor Stadium"],
  [17,"2027-01-03T18:00:00Z","ATL","NO","Mercedes-Benz Stadium"],
  [17,"2027-01-03T18:00:00Z","CAR","SEA","Bank of America Stadium"],
  [17,"2027-01-03T18:00:00Z","CLE","IND","Huntington Bank Field"],
  [17,"2027-01-03T18:00:00Z","DAL","NYG","AT&T Stadium"],
  [17,"2027-01-03T18:00:00Z","MIA","BUF","Hard Rock Stadium"],
  [17,"2027-01-03T18:00:00Z","NYJ","MIN","MetLife Stadium"],
  [17,"2027-01-03T18:00:00Z","TEN","PIT","Nissan Stadium"],
  [17,"2027-01-03T21:05:00Z","ARI","LV","State Farm Stadium"],
  [17,"2027-01-03T21:25:00Z","CHI","DET","Soldier Field"],
  [17,"2027-01-04T01:20:00Z","SF","PHI","Levi's\u00ae Stadium"],
  [17,"2027-01-05T00:00:00Z","JAX","WAS","EverBank Stadium"],
  [17,"2027-01-05T00:00:00Z","LAC","KC","SoFi Stadium"],
  [17,"2027-01-05T00:00:00Z","NE","DEN","Gillette Stadium"],
  [17,"2027-01-05T00:00:00Z","TB","LAR","Raymond James Stadium"],
  [17,"2027-01-05T01:15:00Z","GB","HOU","Lambeau Field"],
  [18,"2027-01-10T00:00:00Z","ARI","SF","State Farm Stadium"],
  [18,"2027-01-10T00:00:00Z","BAL","PIT","M&T Bank Stadium"],
  [18,"2027-01-10T00:00:00Z","BUF","NYJ","Highmark Stadium"],
  [18,"2027-01-10T00:00:00Z","CAR","ATL","Bank of America Stadium"],
  [18,"2027-01-10T00:00:00Z","CIN","CLE","Paycor Stadium"],
  [18,"2027-01-10T00:00:00Z","DEN","LAC","Empower Field at Mile High"],
  [18,"2027-01-10T00:00:00Z","GB","DET","Lambeau Field"],
  [18,"2027-01-10T00:00:00Z","HOU","TEN","Reliant Stadium"],
  [18,"2027-01-10T00:00:00Z","IND","JAX","Lucas Oil Stadium"],
  [18,"2027-01-10T00:00:00Z","KC","LV","Arrowhead Stadium"],
  [18,"2027-01-10T00:00:00Z","LAR","SEA","SoFi Stadium"],
  [18,"2027-01-10T00:00:00Z","MIN","CHI","U.S. Bank Stadium"],
  [18,"2027-01-10T00:00:00Z","NE","MIA","Gillette Stadium"],
  [18,"2027-01-10T00:00:00Z","NO","TB","Caesars Superdome"],
  [18,"2027-01-10T00:00:00Z","NYG","PHI","MetLife Stadium"],
  [18,"2027-01-10T00:00:00Z","WAS","DAL","Northwest Stadium"]
]);

function uclReferenceScheduleGames(){
  return UCL_NFL_SCHEDULE_2026.map(row=>({
    week:Number(row[0])||0,
    scheduled:String(row[1]||''),
    home:String(row[2]||''),
    away:String(row[3]||''),
    location:String(row[4]||''),
    source:'ucl-reference-schedule'
  }));
}
function uclReferenceScheduleKey(game){
  const week=sleeperScheduleGameWeek(game);
  const teams=[...sleeperScheduleTeamCodes(game)].sort().join('|');
  return `${week}:${teams}`;
}
function mergeUclReferenceSchedule(liveGames){
  const refs=uclReferenceScheduleGames();
  const remaining=new Set(refs);
  const merged=[];
  for(const raw of (Array.isArray(liveGames)?liveGames:[])){
    const rawTeams=[...sleeperScheduleTeamCodes(raw)].sort().join('|');
    const rawWeek=sleeperScheduleGameWeek(raw);
    let ref=null;
    if(rawTeams){
      const candidates=[...remaining].filter(candidate=>{
        const teams=[...sleeperScheduleTeamCodes(candidate)].sort().join('|');
        if(teams!==rawTeams)return false;
        const cw=sleeperScheduleGameWeek(candidate);
        return !rawWeek||!cw||rawWeek===cw;
      });
      if(candidates.length===1)ref=candidates[0];
      else if(candidates.length>1){
        const rawMs=sleeperScheduleKickoffMs(raw);
        candidates.sort((a,b)=>{
          if(rawMs==null)return sleeperScheduleGameWeek(a)-sleeperScheduleGameWeek(b);
          return Math.abs(sleeperScheduleKickoffMs(a)-rawMs)-Math.abs(sleeperScheduleKickoffMs(b)-rawMs);
        });
        ref=candidates[0]||null;
      }
    }
    if(ref){
      merged.push({...ref,...raw,scheduled:ref.scheduled,week:ref.week,home:ref.home,away:ref.away,location:raw?.location||ref.location});
      remaining.delete(ref);
    }else{
      merged.push(raw);
    }
  }
  for(const ref of remaining)merged.push(ref);
  return merged;
}
function pacificKickoffParts(game){
  const ms=sleeperScheduleKickoffMs(game);
  if(ms==null)return null;
  const formatter=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Los_Angeles',
    month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'
  });
  const parts=formatter.formatToParts(new Date(ms));
  const get=type=>parts.find(p=>p.type===type)?.value||'';
  return {label:formatter.format(new Date(ms)),zone:get('timeZoneName')};
}

function sleeperScheduleStatus(game){
  return String(game?.status||game?.game_status||game?.gameStatus||'').trim().toLowerCase().replace(/[\s_-]+/g,'');
}
function sleeperScheduleGameWeek(game){
  return Number(game?.week??game?.game_week??game?.leg??0)||0;
}
function sleeperScheduleKickoffMs(game){
  const parsePrecise=value=>{
    if(value==null||value==='')return null;
    const raw=String(value).trim();
    if(typeof value==='number'||/^\d{10,13}$/.test(raw)){
      const n=Number(value);
      if(!Number.isFinite(n))return null;
      return n<1e12?n*1000:n;
    }
    // Sleeper's schedule feed may expose only YYYY-MM-DD. That is a game DATE,
    // not an exact kickoff. Never parse it as midnight UTC.
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return null;
    // A time without a date is also not enough to establish an absolute kickoff.
    if(/^\d{1,2}:\d{2}(?::\d{2})?$/.test(raw))return null;
    const ms=Date.parse(raw);
    return Number.isFinite(ms)?ms:null;
  };
  for(const value of [
    game?.scheduled,game?.kickoff,game?.game_time,game?.gameTime,game?.timestamp,
    game?.start_time,game?.startTime,game?.date
  ]){
    const ms=parsePrecise(value);
    if(ms!=null)return ms;
  }
  return null;
}
function sleeperScheduleGameInExpectedWindow(game,now=Date.now()){
  const kickoff=sleeperScheduleKickoffMs(game);
  if(kickoff==null)return false;
  const end=kickoff+(4*60*60*1000);
  return now>=kickoff&&now<end;
}
function sleeperScheduleStatusClass(game){
  const status=sleeperScheduleStatus(game);
  const finalStatuses=new Set(['complete','completed','finished','final','post','closed']);
  const liveStatuses=new Set(['inprogress','live','halftime','overtime','ot']);
  const pregameStatuses=new Set(['pregame','scheduled','notstarted','upcoming','created']);
  if(finalStatuses.has(status))return 'final';
  if(liveStatuses.has(status))return 'live';
  if(pregameStatuses.has(status))return 'pregame';
  return 'unknown';
}
function sleeperScheduleMatchupKey(game){
  const teams=[...sleeperScheduleTeamCodes(game)].sort();
  if(teams.length<2)return '';
  const week=sleeperScheduleGameWeek(game);
  return `${week||0}:${teams.join('|')}`;
}
function sleeperScheduleLooseMatchupKey(game){
  const teams=[...sleeperScheduleTeamCodes(game)].sort();
  return teams.length>=2?teams.join('|'):'';
}
function sleeperSchedulePreferredRows(games){
  // The bundled reference schedule can coexist with a richer Sleeper row when
  // Sleeper omits a field used by the strict merge key. Collapse those duplicates
  // before evaluating live state. Explicit status always outranks a fallback row.
  const groups=new Map();
  for(const game of (Array.isArray(games)?games:[])){
    const loose=sleeperScheduleLooseMatchupKey(game);
    const key=loose||`row:${groups.size}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(game);
  }
  const rank=game=>{
    const cls=sleeperScheduleStatusClass(game);
    const explicit=cls==='final'||cls==='live'||cls==='pregame';
    const source=String(game?.source||'');
    return (explicit?100:0)+(source==='ucl-reference-schedule'?0:10)+(sleeperScheduleGameWeek(game)?2:0)+(sleeperScheduleKickoffMs(game)!=null?1:0);
  };
  return [...groups.values()].map(rows=>rows.slice().sort((a,b)=>rank(b)-rank(a))[0]);
}
function sleeperScheduleLiveGames(now=Date.now()){
  const week=currentWeekNumber();
  return sleeperSchedulePreferredRows(nflScheduleGames||[]).filter(game=>{
    const gameWeek=sleeperScheduleGameWeek(game);
    if(gameWeek&&gameWeek!==week)return false;
    const cls=sleeperScheduleStatusClass(game);
    if(cls==='final'||cls==='pregame')return false;
    if(cls==='live')return true;
    // Heuristic is only allowed when status is genuinely unavailable/unknown.
    return sleeperScheduleGameInExpectedWindow(game,now);
  });
}
function uclGameDayLiveState(now=Date.now()){
  const games=sleeperScheduleLiveGames(now);
  return {live:games.length>0,count:games.length,games};
}
async function syncNflScheduleStatus(force=false){
  if(nflScheduleSyncPromise)return nflScheduleSyncPromise;
  if(!force&&nflScheduleGames.length&&Date.now()-nflScheduleLastSync<60000)return nflScheduleGames;
  nflScheduleSyncPromise=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const r=await fetch(`https://api.sleeper.app/schedule/nfl/regular/${SLEEPER_SEASON}`,{cache:'no-store',signal:controller.signal});
      if(!r.ok)throw new Error(`Sleeper schedule ${r.status}`);
      const raw=await r.json();
      const list=Array.isArray(raw)?raw:Array.isArray(raw?.games)?raw.games:[];
      nflScheduleGames=mergeUclReferenceSchedule(list);
      nflScheduleLastSync=Date.now();
      return nflScheduleGames;
    }finally{
      clearTimeout(timer);nflScheduleSyncPromise=null;
    }
  })();
  return nflScheduleSyncPromise;
}

let sleeperCtx={username:'',userId:'',leagueId:SLEEPER_LEAGUE_ID,draftId:'',rosterId:null,leagueName:'',teamName:'',lastPickCount:0};
let sleeperTimer=null,sleeperBusy=false,sleeperActiveSyncs=0,lastDraftPicks=[],leagueUsers=[],leagueRosters=[],verifiedLeague=null,verifiedDraft=null,nflState=null,currentMatchups=[],currentTransactions=[],seasonMatchupsByWeek={},seasonTransactionsByWeek={};
let nflScheduleGames=uclReferenceScheduleGames(),nflScheduleLastSync=0,nflScheduleSyncPromise=null;
const seasonFetchCache=new Map();
let seasonDataMeta={lastSync:0,failures:[],historicalWeeksLoaded:0};
let seasonSyncPromise=null;
let draftSyncPromise=null;
let draftSyncSequence=0;
let sleeperRequestSequence=0;
const sleeperInflightRequests=new Map();
let connectGeneration=0;
let startupConnectAttempted=false;
let startupConnectUser='';
let startupConnectRetryTimer=null;
let lastDraftSyncAt=0;
let lastDraftFingerprint='';
let lastSleeperError='';
let lastSleeperErrorAt=0;
let lastSuccessfulSleeperSyncAt=0;
let sleeperErrorLog=[];
let sleeperEndpointState={};
let runtimeDataMode='current';
let runtimeLastSuccess=0;
let lastKnownWeek=0;
let dataIntegrityState={repairs:0,notes:[]};
const RUNTIME_CACHE_KEY=KEY+'-runtime-cache-v2'; // v1.9.0 legacy migration/fallback only
const RUNTIME_BOOTSTRAP_KEY=KEY+'-runtime-bootstrap-v1';
const RUNTIME_LOCAL_MIRROR_KEY=KEY+'-runtime-current-v1';
const RUNTIME_SNAPSHOT_SCHEMA_VERSION=4;
const RUNTIME_SNAPSHOT_SCOPE='runtime';
const RUNTIME_SNAPSHOT_REQUEST_KEY='latest';
const RUNTIME_STALE_AFTER_MS=15*60*1000;
const API_CACHE_DB_NAME='UCL_Companion_2026_API_Cache';
const API_CACHE_DB_VERSION=1;
const API_CACHE_STORE='responses';
const API_CACHE_BACKUP_TYPE='ucl-companion-local-backup';
const API_CACHE_BACKUP_VERSION=1;
const DISCOVERED_PLAYERS_KEY=KEY+'-discovered-players-v1';
const DISCOVERED_PLAYERS_MAX_CHARS=500000;
const RUNTIME_LOCAL_MIRROR_MAX_CHARS=1500000;
const PROJECTION_AVAILABLE_METADATA_PER_POSITION=12;
const SYNC_ARCHIVE_WEEKS_PER_RUN=4;
function readDiscoveredPlayersBounded(){
  const raw=storageGet(DISCOVERED_PLAYERS_KEY,'');
  if(!raw)return {};
  if(raw.length>DISCOVERED_PLAYERS_MAX_CHARS){storageRemove(DISCOVERED_PLAYERS_KEY);return {};}
  try{const parsed=JSON.parse(raw);return parsed&&typeof parsed==='object'?parsed:{};}catch(e){storageRemove(DISCOVERED_PLAYERS_KEY);return {};}
}
let discoveredSleeperPlayers=readDiscoveredPlayersBounded();

let apiCacheDbPromise=null,apiCacheAvailable=null;
const apiCacheSourceByPath=new Map();

const APP_VERSION='1.10.28';
const RELEASE_CHANNEL='Stable';
const LIVE_SEASON_BUILD=true;
const SLEEPER_POLL_MS=30000;



function openApiCacheDb(){
  if(apiCacheDbPromise)return apiCacheDbPromise;
  if(!('indexedDB' in window)){
    apiCacheAvailable=false;
    return Promise.resolve(null);
  }
  apiCacheDbPromise=new Promise(resolve=>{
    let settled=false;
    const finish=value=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve(value);
    };
    // IndexedDB can occasionally remain pending in local-file/private-browser
    // contexts. Storage must never be allowed to hold the whole application hostage.
    const timer=setTimeout(()=>{
      apiCacheAvailable=false;
      apiCacheDbPromise=null;
      finish(null);
    },1800);
    try{
      const req=indexedDB.open(API_CACHE_DB_NAME,API_CACHE_DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(API_CACHE_STORE))db.createObjectStore(API_CACHE_STORE,{keyPath:'key'});
      };
      req.onsuccess=()=>{
        apiCacheAvailable=true;
        finish(req.result);
      };
      req.onerror=()=>{
        apiCacheAvailable=false;
        apiCacheDbPromise=null;
        finish(null);
      };
      req.onblocked=()=>{
        apiCacheAvailable=false;
        apiCacheDbPromise=null;
        finish(null);
      };
    }catch(e){
      apiCacheAvailable=false;
      apiCacheDbPromise=null;
      finish(null);
    }
  });
  return apiCacheDbPromise;
}
function boundedStartup(promise,ms=2200,fallback=null){
  return Promise.race([
    Promise.resolve(promise).catch(()=>fallback),
    new Promise(resolve=>setTimeout(()=>resolve(fallback),ms))
  ]);
}

function backgroundTask(label,task){
  Promise.resolve().then(task).catch(err=>{
    console.warn(`UCL background ${label} failed`,err);
    try{recordSleeperError({path:`background/${label}`,error:err,retries:0,cachedUsed:true,label:`${label} background`});}catch(e){}
  });
}
function apiCacheKey(scope,key){
  return `${scope}:${SLEEPER_SEASON}:${String(key||'')}`;
}
async function apiCacheGet(scope,key){
  const db=await openApiCacheDb();if(!db)return null;
  return new Promise(resolve=>{
    try{
      const tx=db.transaction(API_CACHE_STORE,'readonly');
      const req=tx.objectStore(API_CACHE_STORE).get(apiCacheKey(scope,key));
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>resolve(null);
    }catch(e){resolve(null);}
  });
}
async function apiCachePut(scope,key,value,meta={}){
  const db=await openApiCacheDb();if(!db)return false;
  const row={key:apiCacheKey(scope,key),scope:String(scope),requestKey:String(key||''),time:Date.now(),leagueId:SLEEPER_LEAGUE_ID,value,meta};
  return new Promise(resolve=>{
    try{
      const tx=db.transaction(API_CACHE_STORE,'readwrite');
      tx.objectStore(API_CACHE_STORE).put(row);
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>resolve(false);
      tx.onabort=()=>resolve(false);
    }catch(e){resolve(false);}
  });
}
async function apiCacheDeleteAll(){
  const db=await openApiCacheDb();if(!db)return false;
  return new Promise(resolve=>{
    try{
      const tx=db.transaction(API_CACHE_STORE,'readwrite');
      tx.objectStore(API_CACHE_STORE).clear();
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>resolve(false);
      tx.onabort=()=>resolve(false);
    }catch(e){resolve(false);}
  });
}

async function apiCacheDelete(scope,key){
  const db=await openApiCacheDb();if(!db)return false;
  return new Promise(resolve=>{
    try{
      const tx=db.transaction(API_CACHE_STORE,'readwrite');
      tx.objectStore(API_CACHE_STORE).delete(apiCacheKey(scope,key));
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>resolve(false);
      tx.onabort=()=>resolve(false);
    }catch(e){resolve(false);}
  });
}
async function apiCacheDeleteScope(scope){
  const db=await openApiCacheDb();if(!db)return 0;
  return new Promise(resolve=>{
    let count=0;
    try{
      const tx=db.transaction(API_CACHE_STORE,'readwrite'),store=tx.objectStore(API_CACHE_STORE);
      const req=store.openCursor();
      req.onsuccess=()=>{
        const cursor=req.result;
        if(!cursor)return;
        if(cursor.value?.scope===scope){cursor.delete();count++;}
        cursor.continue();
      };
      tx.oncomplete=()=>resolve(count);
      tx.onerror=()=>resolve(0);
      tx.onabort=()=>resolve(0);
    }catch(e){resolve(0);}
  });
}
async function apiCacheAll(){
  const db=await openApiCacheDb();if(!db)return [];
  return new Promise(resolve=>{
    try{
      const tx=db.transaction(API_CACHE_STORE,'readonly');
      const req=tx.objectStore(API_CACHE_STORE).getAll();
      req.onsuccess=()=>resolve(Array.isArray(req.result)?req.result:[]);
      req.onerror=()=>resolve([]);
    }catch(e){resolve([]);}
  });
}
async function apiCacheImport(rows){
  const db=await openApiCacheDb();if(!db)return 0;
  const clean=(Array.isArray(rows)?rows:[]).filter(r=>r&&typeof r==='object'&&r.key&&'value' in r);
  if(!clean.length)return 0;
  return new Promise(resolve=>{
    let count=0;
    try{
      const tx=db.transaction(API_CACHE_STORE,'readwrite'),store=tx.objectStore(API_CACHE_STORE);
      for(const row of clean){
        store.put({...row,leagueId:row.leagueId||SLEEPER_LEAGUE_ID});
        count++;
      }
      tx.oncomplete=()=>resolve(count);
      tx.onerror=()=>resolve(0);
      tx.onabort=()=>resolve(0);
    }catch(e){resolve(0);}
  });
}
function cacheAgeLabel(ts){
  const age=Math.max(0,Date.now()-Number(ts||0));
  if(age<60000)return 'moments ago';
  if(age<3600000)return `${Math.round(age/60000)}m ago`;
  if(age<86400000)return `${Math.round(age/3600000)}h ago`;
  return `${Math.round(age/86400000)}d ago`;
}
function exportableLocalStorage(){
  const out={};
  for(const key of appStorageKeys()){
    try{out[key]=localStorage.getItem(key);}catch(e){}
  }
  return out;
}
function downloadJsonFile(filename,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function exportLocalBackup(){
  await persistRuntimeCacheNow();
  const indexedDbData=await apiCacheAll();
  const payload={
    type:API_CACHE_BACKUP_TYPE,
    backupVersion:API_CACHE_BACKUP_VERSION,
    appVersion:APP_VERSION,
    createdAt:new Date().toISOString(),
    leagueId:SLEEPER_LEAGUE_ID,
    localStorage:exportableLocalStorage(),
    indexedDbData,
    apiCache:indexedDbData
  };
  downloadJsonFile(`UCL_Companion_2026_Local_Backup_v${APP_VERSION}.json`,payload);
  toast(`Backup downloaded • ${indexedDbData.length} saved IndexedDB record${indexedDbData.length===1?'':'s'}`);
}
async function importLocalBackupFile(file){
  if(!file)return;
  let payload;
  try{payload=JSON.parse(await file.text());}
  catch(e){toast('Backup file is not valid JSON');return;}
  if(payload?.type!==API_CACHE_BACKUP_TYPE||!payload.localStorage||typeof payload.localStorage!=='object'){
    toast('This is not a UCL Companion local backup');return;
  }
  if(payload.leagueId&&String(payload.leagueId)!==String(SLEEPER_LEAGUE_ID)){
    toast('Backup belongs to a different Sleeper league');return;
  }
  for(const [key,value] of Object.entries(payload.localStorage)){
    if(!String(key).startsWith(KEY)||typeof value!=='string')continue;
    try{localStorage.setItem(key,value);}catch(e){}
  }
  const imported=await apiCacheImport(payload.indexedDbData||payload.apiCache||[]);
  toast(`Backup restored • ${imported} saved IndexedDB record${imported===1?'':'s'}`);
  setTimeout(()=>location.reload(),450);
}

function noteIntegrityRepair(note){
  dataIntegrityState.repairs++;
  if(note&&!dataIntegrityState.notes.includes(note))dataIntegrityState.notes.push(note);
  if(dataIntegrityState.notes.length>6)dataIntegrityState.notes=dataIntegrityState.notes.slice(-6);
}
function dedupeMatchupList(list){
  const out=[],seen=new Set();
  for(const m of (Array.isArray(list)?list:[])){
    if(!m||m.roster_id==null)continue;
    const key=`${m.roster_id}:${m.matchup_id??'none'}`;
    if(seen.has(key)){noteIntegrityRepair('Duplicate matchup rows cleaned');continue;}
    seen.add(key);out.push(m);
  }
  return out;
}
function transactionStableKey(tx){
  if(tx?.transaction_id)return `id:${tx.transaction_id}`;
  return `fallback:${tx?.created||0}:${tx?.type||''}:${(tx?.roster_ids||[]).join(',')}:${Object.keys(tx?.adds||{}).sort().join(',')}:${Object.keys(tx?.drops||{}).sort().join(',')}`;
}
function dedupeTransactionList(list){
  const out=[],seen=new Set();
  for(const tx of (Array.isArray(list)?list:[])){
    if(!tx||typeof tx!=='object')continue;
    const key=transactionStableKey(tx);
    if(seen.has(key)){noteIntegrityRepair('Duplicate transactions cleaned');continue;}
    seen.add(key);out.push(tx);
  }
  return out;
}
function normalizeWeekMap(map,kind='matchup'){
  const out={};
  if(!map||typeof map!=='object')return out;
  for(const [k,v] of Object.entries(map)){
    const week=Number(k);
    if(!Number.isInteger(week)||week<1||week>18){noteIntegrityRepair('Invalid week data removed');continue;}
    out[week]=kind==='transaction'?dedupeTransactionList(v):dedupeMatchupList(v);
  }
  return out;
}
function uniqueRosters(list){
  const out=[],seen=new Set();
  for(const r of (Array.isArray(list)?list:[])){
    if(!r||r.roster_id==null)continue;
    const key=String(r.roster_id);
    if(seen.has(key)){noteIntegrityRepair('Duplicate roster data cleaned');continue;}
    seen.add(key);out.push(r);
  }
  return out;
}
function uniqueDraftPicks(list){
  const out=[],seen=new Set();
  for(const p of (Array.isArray(list)?list:[])){
    if(!p)continue;
    const key=String(p.pick_no??`${p.round||''}:${p.player_id||''}:${p.roster_id||''}`);
    if(seen.has(key)){noteIntegrityRepair('Duplicate draft picks cleaned');continue;}
    seen.add(key);out.push(p);
  }
  return out;
}
function normalizeRuntimeCache(c){
  if(!c||typeof c!=='object')return null;
  return {
    ...c,
    version:RUNTIME_SNAPSHOT_SCHEMA_VERSION,
    leagueUsers:Array.isArray(c.leagueUsers)?c.leagueUsers.filter(Boolean):[],
    leagueRosters:uniqueRosters(c.leagueRosters),
    lastDraftPicks:uniqueDraftPicks(c.lastDraftPicks),
    currentMatchups:dedupeMatchupList(c.currentMatchups),
    currentTransactions:dedupeTransactionList(c.currentTransactions),
    seasonMatchupsByWeek:normalizeWeekMap(c.seasonMatchupsByWeek,'matchup'),
    seasonTransactionsByWeek:normalizeWeekMap(c.seasonTransactionsByWeek,'transaction'),
    seasonDataMeta:c.seasonDataMeta&&typeof c.seasonDataMeta==='object'?c.seasonDataMeta:{lastSync:0,failures:[],historicalWeeksLoaded:0},
    lastKnownWeek:Number(c.lastKnownWeek||0)
  };
}
function resolveSelectedRosterAfterRestore(){
  if(sleeperCtx.rosterId&&leagueRosters.some(r=>String(r.roster_id)===String(sleeperCtx.rosterId)))return true;
  const byOwner=sleeperCtx.userId?leagueRosters.find(r=>String(r.owner_id)===String(sleeperCtx.userId)):null;
  if(byOwner){
    sleeperCtx.rosterId=String(byOwner.roster_id);
    noteIntegrityRepair('Selected roster repaired');
    return true;
  }
  sleeperCtx.rosterId=null;
  return false;
}
function handleWeekTransition(nextWeek){
  const w=Number(nextWeek||0);
  if(!w)return;
  if(lastKnownWeek&&w!==lastKnownWeek){
    currentMatchups=[];
    currentTransactions=[];
    selectedWeeklyReportWeek=null;
    playoffScenarioOutcomes={};
    for(const path of [...seasonFetchCache.keys()]){
      if(path.includes('/matchups/')||path.includes('/transactions/')||path==='/state/nfl')seasonFetchCache.delete(path);
    }
    noteIntegrityRepair(`Advanced to Week ${w}`);
  }
  lastKnownWeek=w;
}
function runDataIntegrityAudit(){
  const before=dataIntegrityState.repairs;
  leagueRosters=uniqueRosters(leagueRosters);
  lastDraftPicks=uniqueDraftPicks(lastDraftPicks);
  currentMatchups=dedupeMatchupList(currentMatchups);
  currentTransactions=dedupeTransactionList(currentTransactions);
  seasonMatchupsByWeek=normalizeWeekMap(seasonMatchupsByWeek,'matchup');
  seasonTransactionsByWeek=normalizeWeekMap(seasonTransactionsByWeek,'transaction');
  resolveSelectedRosterAfterRestore();
  return {repairs:dataIntegrityState.repairs-before,totalRepairs:dataIntegrityState.repairs,notes:[...dataIntegrityState.notes]};
}
function runtimeCachePayload(){
  return {
    version:RUNTIME_SNAPSHOT_SCHEMA_VERSION,savedAt:Date.now(),leagueId:SLEEPER_LEAGUE_ID,
    username:sleeperCtx.username||'',
    sleeperCtx:{...sleeperCtx},
    leagueUsers,leagueRosters,verifiedLeague,verifiedDraft,nflState,
    lastDraftPicks,currentMatchups,currentTransactions,
    seasonMatchupsByWeek,seasonTransactionsByWeek,
    nflByeWeeks:{...NFL_TEAM_BYE_WEEKS_2026},
    seasonDataMeta,lastDraftFingerprint,lastDraftSyncAt,lastKnownWeek
  };
}
function runtimeBootstrapPayload(payload=runtimeCachePayload()){
  return {
    version:1,
    savedAt:Number(payload.savedAt||Date.now()),
    leagueId:SLEEPER_LEAGUE_ID,
    username:String(payload.username||''),
    rosterId:payload?.sleeperCtx?.rosterId??null,
    userId:String(payload?.sleeperCtx?.userId||''),
    teamName:String(payload?.sleeperCtx?.teamName||''),
    week:Number(payload?.nflState?.week||payload?.lastKnownWeek||0)
  };
}
function readRuntimeLocalMirror(username=''){
  const raw=storageGet(RUNTIME_LOCAL_MIRROR_KEY,'');
  if(!raw)return null;
  if(raw.length>RUNTIME_LOCAL_MIRROR_MAX_CHARS){storageRemove(RUNTIME_LOCAL_MIRROR_KEY);return null;}
  let parsed=null;try{parsed=JSON.parse(raw);}catch(e){storageRemove(RUNTIME_LOCAL_MIRROR_KEY);return null;}
  const c=normalizeRuntimeCache(parsed);
  if(!c||String(c.leagueId)!==String(SLEEPER_LEAGUE_ID))return null;
  if(username&&c.username&&String(c.username)!==String(username))return null;
  return c;
}
function writeRuntimeLocalMirror(payload){
  try{
    const raw=JSON.stringify(payload);
    if(raw.length>RUNTIME_LOCAL_MIRROR_MAX_CHARS){storageRemove(RUNTIME_LOCAL_MIRROR_KEY);return false;}
    return storageSet(RUNTIME_LOCAL_MIRROR_KEY,raw);
  }catch(e){return false;}
}

function newestRuntimeCache(...items){
  return items.filter(Boolean).sort((a,b)=>Number(b.savedAt||0)-Number(a.savedAt||0))[0]||null;
}
function readLegacyRuntimeCache(username=''){
  let c=storageGetJson(RUNTIME_CACHE_KEY,null);
  if(!c)c=storageGetJson(KEY+'-runtime-cache-v1',null);
  c=normalizeRuntimeCache(c);
  if(!c||String(c.leagueId)!==String(SLEEPER_LEAGUE_ID))return null;
  if(username&&c.username&&String(c.username)!==String(username))return null;
  return c;
}
let runtimePersistTimer=null,runtimePersistPromise=null,runtimePersistDirty=false;
async function flushRuntimeCachePersistence(){
  if(!sleeperCtx.username||!verifiedLeague)return false;
  if(runtimePersistPromise)return runtimePersistPromise;
  runtimePersistDirty=false;
  runtimePersistPromise=(async()=>{
    runDataIntegrityAudit();
    const payload=runtimeCachePayload();
    runtimeLastSuccess=Number(payload.savedAt||Date.now());
    storageSetJson(RUNTIME_BOOTSTRAP_KEY,runtimeBootstrapPayload(payload));
    // Keep a bounded best-effort local mirror even when IndexedDB succeeds.
    const mirrored=writeRuntimeLocalMirror(payload);
    const saved=await apiCachePut(RUNTIME_SNAPSHOT_SCOPE,RUNTIME_SNAPSHOT_REQUEST_KEY,payload,{
      schemaVersion:RUNTIME_SNAPSHOT_SCHEMA_VERSION,
      kind:'season-runtime-snapshot'
    });
    storageRemove(RUNTIME_CACHE_KEY);
    storageRemove(KEY+'-runtime-cache-v1');
    if(!saved&&!mirrored)storageSetJson(RUNTIME_CACHE_KEY,payload);
    return saved||mirrored;
  })();
  try{return await runtimePersistPromise;}
  finally{
    runtimePersistPromise=null;
    if(runtimePersistDirty&&!runtimePersistTimer){
      runtimePersistTimer=setTimeout(()=>{runtimePersistTimer=null;flushRuntimeCachePersistence().catch(()=>{});},75);
    }
  }
}
async function persistRuntimeCacheNow(){
  if(!sleeperCtx.username||!verifiedLeague)return false;
  runtimePersistDirty=true;
  if(runtimePersistTimer){clearTimeout(runtimePersistTimer);runtimePersistTimer=null;}
  if(runtimePersistPromise){
    await runtimePersistPromise.catch(()=>false);
    if(!runtimePersistDirty)return true;
  }
  return flushRuntimeCachePersistence();
}
function persistRuntimeCache(){
  if(!sleeperCtx.username||!verifiedLeague)return false;
  runtimePersistDirty=true;
  if(!runtimePersistTimer&&!runtimePersistPromise){
    runtimePersistTimer=setTimeout(()=>{runtimePersistTimer=null;flushRuntimeCachePersistence().catch(()=>{});},75);
  }
  return true;
}
function applyRuntimeCache(c,username=''){
  c=normalizeRuntimeCache(c);
  if(!c)return false;
  sleeperCtx={...sleeperCtx,...(c.sleeperCtx||{}),username:username||c.username||sleeperCtx.username};
  leagueUsers=Array.isArray(c.leagueUsers)?c.leagueUsers:leagueUsers;
  leagueRosters=Array.isArray(c.leagueRosters)?c.leagueRosters:leagueRosters;
  verifiedLeague=c.verifiedLeague||verifiedLeague;
  verifiedDraft=c.verifiedDraft||verifiedDraft;
  nflState=c.nflState||nflState;
  lastDraftPicks=Array.isArray(c.lastDraftPicks)?c.lastDraftPicks:lastDraftPicks;
  currentMatchups=Array.isArray(c.currentMatchups)?c.currentMatchups:currentMatchups;
  currentTransactions=Array.isArray(c.currentTransactions)?c.currentTransactions:currentTransactions;
  seasonMatchupsByWeek=c.seasonMatchupsByWeek||seasonMatchupsByWeek;
  seasonTransactionsByWeek=c.seasonTransactionsByWeek||seasonTransactionsByWeek;
  seasonDataMeta=c.seasonDataMeta||seasonDataMeta;
  // v1.9.19 migration: older snapshots duplicated an unbounded player registry.
  // Recover only currently tracked UCL players from that legacy field.
  if(c.discoveredSleeperPlayers&&typeof c.discoveredSleeperPlayers==='object'&&typeof trackedUclPlayerIds==='function'){
    const recovered=[];
    for(const id of trackedUclPlayerIds()){
      const raw=c.discoveredSleeperPlayers[String(id)];
      if(!raw)continue;
      rememberDiscoveredPlayer(id,raw,{persist:false});recovered.push(String(id));
    }
    if(recovered.length&&typeof persistDiscoveredPlayers==='function')persistDiscoveredPlayers(recovered);
  }
  lastDraftFingerprint=c.lastDraftFingerprint||currentDraftFingerprint(lastDraftPicks,verifiedDraft);
  lastDraftSyncAt=Number(c.lastDraftSyncAt||0);
  lastKnownWeek=Number(c.lastKnownWeek||0);
  runDataIntegrityAudit();
  runtimeLastSuccess=Number(c.savedAt||seasonDataMeta.lastSync||lastDraftSyncAt||0);
  runtimeDataMode=runtimeCacheFreshnessMode(runtimeLastSuccess);
  if(sleeperCtx.username){
    setVerification(!!verifiedLeague);
    setSleeperTeamName(sleeperCtx.teamName,sleeperCtx.username);
  }
  return true;
}
async function peekNewestRuntimeCache(username=''){
  const mirror=readRuntimeLocalMirror(username);
  const row=await apiCacheGet(RUNTIME_SNAPSHOT_SCOPE,RUNTIME_SNAPSHOT_REQUEST_KEY);
  const indexed=normalizeRuntimeCache(row?.value||null);
  const validIndexed=indexed&&String(indexed.leagueId)===String(SLEEPER_LEAGUE_ID)&&
    (!username||!indexed.username||String(indexed.username)===String(username))?indexed:null;
  return newestRuntimeCache(validIndexed,mirror);
}
async function readRuntimeCacheAsync(username=''){
  const row=await apiCacheGet(RUNTIME_SNAPSHOT_SCOPE,RUNTIME_SNAPSHOT_REQUEST_KEY);
  const indexed=normalizeRuntimeCache(row?.value||null);
  const validIndexed=indexed&&String(indexed.leagueId)===String(SLEEPER_LEAGUE_ID)&&
    (!username||!indexed.username||String(indexed.username)===String(username))?indexed:null;
  const mirror=readRuntimeLocalMirror(username);
  const legacy=readLegacyRuntimeCache(username);
  const c=newestRuntimeCache(validIndexed,mirror,legacy);
  if(!c)return null;

  const cTime=Number(c.savedAt||0),idbTime=Number(validIndexed?.savedAt||0),mirrorTime=Number(mirror?.savedAt||0);
  if(cTime>idbTime){
    await apiCachePut(RUNTIME_SNAPSHOT_SCOPE,RUNTIME_SNAPSHOT_REQUEST_KEY,c,{
      schemaVersion:RUNTIME_SNAPSHOT_SCHEMA_VERSION,
      repairedFrom:mirror===c?'local-mirror':'legacy-localStorage'
    });
  }
  if(cTime>mirrorTime)writeRuntimeLocalMirror(c);
  storageSetJson(RUNTIME_BOOTSTRAP_KEY,runtimeBootstrapPayload(c));
  storageRemove(RUNTIME_CACHE_KEY);
  storageRemove(KEY+'-runtime-cache-v1');
  return c;
}
async function hydrateRuntimeCacheAsync(username=''){
  const c=await readRuntimeCacheAsync(username);
  return c?applyRuntimeCache(c,username):false;
}
function hydrateRuntimeCache(username=''){
  // Immediate saved-data path used before IndexedDB finishes opening.
  const c=newestRuntimeCache(readRuntimeLocalMirror(username),readLegacyRuntimeCache(username));
  return c?applyRuntimeCache(c,username):false;
}
async function hydrateSavedProjectionMap(week=currentWeekNumber()){
  week=Math.max(1,Math.min(18,Number(week)||currentWeekNumber()));
  const row=await apiCacheGet('projection',`week-${week}`);
  if(!row?.value)return 0;
  const map=normalizeWeek1Projections(row.value);
  if(!map.size)return 0;
  weekProjectionMaps.set(week,map);
  rememberProjectionMap(week,map);
  return map.size;
}
async function hydrateSavedProjectionMaps(preferredWeek=currentWeekNumber()){
  const rows=await apiCacheAll();
  const projectionRows=rows
    .filter(r=>r.scope==='projection'&&/^week-\d+$/.test(String(r.requestKey||'')))
    .sort((a,b)=>Number(b.time||0)-Number(a.time||0));
  let restored=0;
  for(const row of projectionRows){
    const week=Number(String(row.requestKey).replace('week-',''));
    if(!Number.isInteger(week)||week<1||week>18)continue;
    const map=normalizeWeek1Projections(row.value);
    if(!map.size)continue;
    weekProjectionMaps.set(week,map);
    restored++;
  }
  const preferred=weekProjectionMaps.get(Number(preferredWeek));
  if(preferred)rememberProjectionMap(Number(preferredWeek),preferred);
  else if(projectionRows.length){
    const week=Number(String(projectionRows[0].requestKey).replace('week-',''));
    const map=weekProjectionMaps.get(week);
    if(map)rememberProjectionMap(week,map);
  }
  return restored;
}

function runtimeCacheFreshnessMode(ts=runtimeLastSuccess){
  const at=Number(ts||0);
  if(!at)return 'saved';
  return Date.now()-at>RUNTIME_STALE_AFTER_MS?'stale':'saved';
}
function runtimeDataModeLabel(mode=runtimeDataMode){
  return mode==='current'?'Current':mode==='saved'?'Saved':mode==='stale'?'Stale':mode==='partial'?'Partial':mode==='offline'?'Offline':String(mode||'Unknown');
}
function runtimeCacheAgeText(){
  if(!runtimeLastSuccess)return 'saved data';
  const mins=Math.max(0,Math.round((Date.now()-runtimeLastSuccess)/60000));
  if(mins<1)return 'saved moments ago';
  if(mins<60)return `saved ${mins}m ago`;
  const hrs=Math.round(mins/60);
  return `saved ${hrs}h ago`;
}
function markRuntimeCurrent(){
  runtimeDataMode='current';
  runtimeLastSuccess=Date.now();
  persistRuntimeCache();
}
function markRuntimeDegraded(mode='partial'){
  if(runtimeDataMode!=='offline')runtimeDataMode=mode;
}
function stopSleeperPolling(){if(sleeperTimer){clearInterval(sleeperTimer);sleeperTimer=null;}}
function startSleeperPolling(){stopSleeperPolling();return false;}
function setSyncStatus(kind,msg){
  const dot=$('#syncDot'),txt=$('#syncText'),wrap=dot?.closest('.sync-status');
  if(!dot||!txt)return;
  dot.className='sync-dot '+(kind||'');
  txt.textContent=msg||'';
  if(wrap){
    const label=msg||(
      kind==='ok'?'Sleeper connected':
      kind==='err'?'Sleeper connection error':
      kind==='busy'?'Syncing Sleeper':'Sleeper status'
    );
    wrap.title=label;
    wrap.setAttribute('aria-label',label);
    wrap.setAttribute('role','status');
  }
}
function syncStamp(){return new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit',second:'2-digit'});}
function setSleeperTeamName(teamName,username){
  const clean=String(teamName||'').trim(),user=String(username||'').trim();
  const opt=[...$('#sleeperUser').options].find(o=>o.value===user);
  if(opt) opt.textContent=clean&&clean.toLowerCase()!==user.toLowerCase()?`${user} - ${clean}`:user;
}
function populateSleeperTeamOptions(users){
  const select=$('#sleeperUser');
  const selected=select.value||storageGet(KEY+'-sleeper-user','')||'';
  const byName=new Map();
  for(const u of (users||[])){
    const username=String(u.display_name||u.username||'').trim();
    if(!username) continue;
    const teamName=String(u?.metadata?.team_name||'').trim();
    byName.set(username.toLowerCase(),{username,teamName});
  }
  [...select.options].forEach(opt=>{
    if(!opt.value)return;
    const hit=byName.get(String(opt.value).toLowerCase());
    if(hit) opt.textContent=hit.teamName&&hit.teamName.toLowerCase()!==hit.username.toLowerCase()?`${hit.username} - ${hit.teamName}`:hit.username;
  });
  if(selected&&[...select.options].some(o=>o.value===selected))select.value=selected;

  sizeSleeperTeamSelect();
}

function sleeperErrorType(err){
  if(err?.name==='AbortError')return 'timeout';
  const status=Number(err?.status||0);
  if(status===429)return 'rate-limit';
  if(status>=500)return 'server';
  if(status>=400)return 'api';
  const msg=String(err?.message||err||'');
  if(/failed to fetch|networkerror|load failed/i.test(msg))return 'network';
  return 'unknown';
}

function endpointState(path,status,{label='',error=null,cachedUsed=false}={}){
  const key=String(path||label||'unknown');
  sleeperEndpointState[key]={
    path:key,label:String(label||key),status,
    at:Date.now(),
    message:error?describeSleeperError(error):'',
    cachedUsed:!!cachedUsed
  };
}
function endpointStateLabel(row){
  if(!row)return 'unknown';
  if(row.status==='fresh')return 'current';
  if(row.status==='stale')return row.cachedUsed?'cached':'stale';
  if(row.status==='failed')return 'failed';
  return row.status||'unknown';
}
function endpointFailureCount(){
  return Object.values(sleeperEndpointState).filter(x=>x.status==='failed').length;
}
function endpointStaleCount(){
  return Object.values(sleeperEndpointState).filter(x=>x.status==='stale').length;
}
function recordSleeperError({path='',error=null,retries=0,cachedUsed=false,label=''}={}){
  const status=Number(error?.status||0)||null;
  const row={
    at:Date.now(),
    path:String(path||label||'unknown'),
    label:String(label||''),
    status,
    type:sleeperErrorType(error),
    message:describeSleeperError(error),
    retries:Number(retries||0),
    cachedUsed:!!cachedUsed
  };
  sleeperErrorLog.unshift(row);
  sleeperErrorLog=sleeperErrorLog.slice(0,8);
  return row;
}
function markSleeperSuccess(){
  lastSuccessfulSleeperSyncAt=Date.now();
}
function setVerification(ok,err=''){
  // Verification popover was removed from the Live Season UI. Keep this helper
  // as a compatibility no-op for older call sites.
  return !!ok;
}
function describeSleeperError(err){
  if(err?.name==='AbortError')return 'Sleeper request timed out';
  if(Number(err?.status)===429)return 'Sleeper rate limit reached';
  if(Number(err?.status)>=500)return `Sleeper server error ${err.status}`;
  if(Number(err?.status)>=400)return `Sleeper API error ${err.status}`;
  const msg=String(err?.message||err||'').trim();
  if(/failed to fetch|networkerror|load failed/i.test(msg))return 'Network request to Sleeper failed';
  return msg||'Sleeper request failed';
}
async function sleeperGet(path){
  const key=String(path||'');
  const existing=sleeperInflightRequests.get(key);
  if(existing)return existing.promise;

  const requestId=++sleeperRequestSequence;
  const promise=(async()=>{
    let lastErr=null;
    for(let attempt=0;attempt<3;attempt++){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),9000);
      try{
        const r=await fetch(SLEEPER_API+path,{cache:'no-store',signal:controller.signal});
        clearTimeout(timer);
        if(!r.ok){
          const err=new Error(`Sleeper API ${r.status}`);
          err.status=r.status;
          if(r.status<500&&r.status!==429)throw err;
          lastErr=err;
        }else{
          const value=await r.json();
          markSleeperSuccess();
          return value;
        }
      }catch(err){
        clearTimeout(timer);
        lastErr=err;
        if(err?.status&&err.status<500&&err.status!==429)throw err;
      }
      if(attempt<2)await new Promise(resolve=>setTimeout(resolve,attempt===0?450:1100));
    }
    lastSleeperError=describeSleeperError(lastErr);
    lastSleeperErrorAt=Date.now();
    recordSleeperError({path,error:lastErr,retries:3,cachedUsed:false});
    throw lastErr||new Error('Sleeper request failed');
  })();
  sleeperInflightRequests.set(key,{requestId,promise});
  try{return await promise;}
  finally{
    if(sleeperInflightRequests.get(key)?.requestId===requestId)sleeperInflightRequests.delete(key);
  }
}
async function sleeperGetCached(path,ttlMs=300000,force=false){
  const now=Date.now(),memory=seasonFetchCache.get(path);
  apiCacheSourceByPath.delete(path);
  if(!force&&memory&&now-memory.time<ttlMs){
    apiCacheSourceByPath.set(path,'memory');
    endpointState(path,'fresh',{cachedUsed:true});
    return memory.value;
  }

  const persistent=await apiCacheGet('api',path);
  if(!force&&persistent&&now-Number(persistent.time||0)<ttlMs){
    seasonFetchCache.set(path,{time:Number(persistent.time||now),value:persistent.value});
    apiCacheSourceByPath.set(path,'persistent');
    endpointState(path,'fresh',{cachedUsed:true});
    return persistent.value;
  }

  try{
    const value=await sleeperGet(path);
    const savedAt=Date.now();
    seasonFetchCache.set(path,{time:savedAt,value});
    apiCacheSourceByPath.set(path,'network');
    apiCachePut('api',path,value,{ttlMs}).catch(()=>{});
    endpointState(path,'fresh',{cachedUsed:false});
    return value;
  }catch(error){
    if(persistent){
      seasonFetchCache.set(path,{time:Number(persistent.time||0),value:persistent.value});
      apiCacheSourceByPath.set(path,'persistent-stale');
      endpointState(path,'stale',{error,cachedUsed:true});
      return persistent.value;
    }
    throw error;
  }
}
async function sleeperGetSafe(path,{ttlMs=300000,force=false,fallback=null,label=path}={}){
  try{
    const value=await sleeperGetCached(path,ttlMs,force);
    const source=apiCacheSourceByPath.get(path)||'network';
    const stale=source==='persistent-stale';
    endpointState(path,stale?'stale':'fresh',{label,cachedUsed:source!=='network'});
    return {ok:true,value,label,path,cached:source!=='network',stale,source};
  }catch(error){
    const hasFallback=fallback!==null&&fallback!==undefined;
    const latest=sleeperErrorLog.find(e=>e.path===path&&Date.now()-e.at<5000);
    if(latest)latest.cachedUsed=hasFallback;
    else recordSleeperError({path,error,retries:3,cachedUsed:hasFallback,label});
    endpointState(path,hasFallback?'stale':'failed',{label,error,cachedUsed:hasFallback});
      return {ok:false,value:fallback,error,label,path,cached:hasFallback};
  }
}
function applyLifecycleUI(){
  const complete=typeof draftAllowsPostDraftViews==='function'&&draftAllowsPostDraftViews();
  document.body.classList.toggle('live-season-build',!!LIVE_SEASON_BUILD);
  document.body.classList.toggle('post-draft-mode',complete);
  if(typeof updateCommandCenter==='function')updateCommandCenter();
}
function companionDataHealth(){
  const issues=[];
  const rosterIds=(leagueRosters||[]).map(r=>String(r.roster_id));
  if(new Set(rosterIds).size!==rosterIds.length)issues.push('duplicate roster IDs');
  if(sleeperCtx.rosterId&&!rosterIds.includes(String(sleeperCtx.rosterId)))issues.push('selected roster missing');
  if((leagueRosters||[]).some(r=>!r.owner_id))issues.push('unowned roster');
  if(seasonDataMeta.failures.length)issues.push(`${seasonDataMeta.failures.length} season endpoint issue${seasonDataMeta.failures.length===1?'':'s'}`);
  const failedEndpoints=endpointFailureCount(),staleEndpoints=endpointStaleCount();
  if(failedEndpoints)issues.push(`${failedEndpoints} endpoint failed`);
  else if(staleEndpoints)issues.push(`${staleEndpoints} endpoint using saved data`);
  return {ok:issues.length===0&&runtimeDataMode==='current',issues,mode:runtimeDataMode,failedEndpoints,staleEndpoints};
}

function normName(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function leagueUserById(id){return leagueUsers.find(u=>String(u.user_id)===String(id));}
function rosterById(id){return leagueRosters.find(r=>String(r.roster_id)===String(id));}
function rosterOwnerName(rosterId,pickedBy=''){
  const roster=rosterById(rosterId);
  const uid=roster?.owner_id||pickedBy;
  const u=leagueUserById(uid);
  const team=String(u?.metadata?.team_name||'').trim();
  return team||u?.display_name||u?.username||String(uid||`Roster ${rosterId}`);
}
function pickLabel(pick){
  const round=Number(pick.round||0);
  const pickNo=Number(pick.pick_no||0);
  const teams=Number(verifiedLeague?.total_rosters||8);
  if(round&&pickNo&&teams){
    const within=((pickNo-1)%teams)+1;
    return `${round}.${String(within).padStart(2,'0')}`;
  }
  const slot=Number(pick.draft_slot||0);
  return round&&slot?`${round}.${String(slot).padStart(2,'0')}`:`#${pick.pick_no||'?'}`;
}

function sleeperPickName(pick){
  const md=pick?.metadata||{};
  if(md.first_name&&md.last_name)return `${md.first_name} ${md.last_name}`.trim();
  if(md.name)return String(md.name).trim();
  if(md.full_name)return String(md.full_name).trim();
  return '';
}
function sleeperPickPlayer(pick){
  const ranked=playerFromPick(pick);
  if(ranked)return {...ranked,ranked:true,rank:ranked.rank,sourcePick:pick};
  const md=pick?.metadata||{},id=String(pick?.player_id||'');
  const db=discoveredSleeperPlayers[id]||{};
  const rawPos=String(db.position||md.position||'').toUpperCase();
  const pos=rawPos==='DST'?'DEF':rawPos;
  const name=String(db.full_name||[db.first_name,db.last_name].filter(Boolean).join(' ')||sleeperPickName(pick)||id||'Unknown Sleeper Player');
  const team=String(db.team||md.team||'—').toUpperCase();
  // Display lookup only: player metadata is persisted during explicit sync/ingestion.
  // Rendering Command Center or Report Card must never rewrite discovered-player storage.
  return {
    id,rank:null,name,team,pos,
    posRank:pos?`${pos} • NR`:'NR',bye:nflTeamByeWeek(team),proj:null,ranked:false,sourcePick:pick
  };
}
async function resolveMissingSleeperPickNames(){
  const missing=lastDraftPicks.filter(p=>!sleeperPickName(p)&&p?.player_id);
  if(!missing.length)return false;
  let changed=false;
  for(const pick of missing){
    const db=discoveredSleeperPlayers?.[pick.player_id];
    if(!db)continue;
    pick.metadata=pick.metadata||{};
    if(!pick.metadata.first_name&&db.first_name)pick.metadata.first_name=db.first_name;
    if(!pick.metadata.last_name&&db.last_name)pick.metadata.last_name=db.last_name;
    if(!pick.metadata.name&&db.full_name)pick.metadata.name=db.full_name;
    if(!pick.metadata.position&&db.position)pick.metadata.position=db.position;
    if(!pick.metadata.team&&db.team)pick.metadata.team=db.team;
    changed=true;
  }
  return changed;
}
function mySleeperPlayers(){
  const seen=new Set(),out=[];
  for(const pick of myRawPicks()){
    const p=sleeperPickPlayer(pick);
    const key=p.ranked?`rank-${p.rank}`:`id-${pick.player_id||normName(p.name)}`;
    if(seen.has(key))continue;
    seen.add(key);out.push(p);
  }
  return out;
}
function playerFromPick(pick){
  const md=pick.metadata||{};
  const full=(md.first_name&&md.last_name)?`${md.first_name} ${md.last_name}`:(md.name||'');
  const n=normName(full);
  if(n){
    const hit=PLAYERS.find(p=>normName(p.name)===n);
    if(hit)return hit;
  }
  const team=String(md.team||'').toUpperCase(),pos=String(md.position||'').toUpperCase();
  if(full){
    const last=normName(md.last_name||full.split(' ').slice(-1)[0]);
    const hits=PLAYERS.filter(p=>normName(p.name).endsWith(last)&&(!team||p.team===team)&&(!pos||p.pos===pos));
    if(hits.length===1)return hits[0];
  }
  return null;
}
function renderRecentPicks(){
  const t=$('#recentTicker'),track=$('#tickerTrack');
  const picks=lastDraftPicks.slice().sort((a,b)=>(b.pick_no||0)-(a.pick_no||0)).slice(0,3);
  if(!picks.length){t.classList.remove('show');track.innerHTML='';return;}
  const items=picks.map(p=>{
    const md=p.metadata||{},name=sleeperPickName(p)||String(p.player_id||'Unknown Sleeper Player');
    const pos=String(md.position||'').toUpperCase();
    const posText=pos?` <span class="ticker-pos">${esc(pos)}</span>`:'';
    return `<span class="ticker-pick"><b>${pickLabel(p)} ${esc(name)}</b>${posText} <span class="who">→ ${esc(rosterOwnerName(p.roster_id,p.picked_by))}</span></span>`;
  }).join('');
  track.innerHTML=`<div class="ticker-marquee"><div class="ticker-sequence">${items}</div><div class="ticker-sequence" aria-hidden="true">${items}</div></div>`;
  t.classList.add('show');
}

function draftLogValue(pick,ranked){
  const pickNo=Number(pick.pick_no||0);
  if(!ranked){
    return {cls:'nr',label:'NR',detail:'Off-list pick'};
  }
  const delta=pickNo-ranked.rank; // positive = value/steal, negative = reach
  if(delta>=15)return {cls:'steal',label:`+${delta}`,detail:`Big steal • ${delta} picks after list rank`};
  if(delta>=5)return {cls:'steal',label:`+${delta}`,detail:`Steal • ${delta} picks after list rank`};
  if(delta<=-30)return {cls:'bad',label:`${delta}`,detail:`VERY BAD REACH • ${Math.abs(delta)} picks early`};
  if(delta<=-15)return {cls:'bad',label:`${delta}`,detail:`Bad reach • ${Math.abs(delta)} picks early`};
  if(delta<=-5)return {cls:'reach',label:`${delta}`,detail:`Reach • ${Math.abs(delta)} picks early`};
  return {cls:'neutral',label:delta===0?'EVEN':delta>0?`+${delta}`:`${delta}`,detail:'Near list value'};
}
function renderDraftLog(){
  const body=$('#draftLogBody'),summary=$('#logSummaryStrip');
  if(!lastDraftPicks.length){
    body.innerHTML='<tr><td colspan="8" class="empty">No Sleeper picks yet.</td></tr>';
    if(summary)summary.innerHTML='';
    return;
  }
  if(summary){
    const vals=lastDraftPicks.map(p=>({p,ranked:playerFromPick(p)}));
    const reaches=vals.filter(x=>x.ranked&&(Number(x.p.pick_no||0)-x.ranked.rank)<=-5).length;
    const steals=vals.filter(x=>x.ranked&&(Number(x.p.pick_no||0)-x.ranked.rank)>=5).length;
    const off=vals.filter(x=>!x.ranked).length;
    const near=vals.length-reaches-steals-off;
    summary.innerHTML=`<span><b>${lastDraftPicks.length}</b> picks</span><span><b>${steals}</b> steals</span><span><b>${reaches}</b> reaches</span><span><b>${off}</b> off-list</span><span><b>${near}</b> near value</span>`;
  }
  body.innerHTML=lastDraftPicks.slice().sort((a,b)=>(a.pick_no||0)-(b.pick_no||0)).map(p=>{
    const md=p.metadata||{},name=sleeperPickName(p)||String(p.player_id||'Unknown Sleeper Player');
    const mine=String(p.picked_by||'')===String(sleeperCtx.userId)||(sleeperCtx.rosterId!=null&&String(p.roster_id||'')===String(sleeperCtx.rosterId));
    const ranked=playerFromPick(p);
    const rankText=ranked?`#${ranked.rank}`:'NR';
    const val=draftLogValue(p,ranked);
    return `<tr class="${mine?'mine-log':''}">
      <td><b>${pickLabel(p)}</b><br><span class="small">#${esc(p.pick_no||'—')} overall</span></td>
      <td><b>${rankText}</b></td>
      <td><span class="log-value ${val.cls}" title="${esc(val.detail)}">${esc(val.label)}<small>${val.cls==='steal'?'VALUE':val.cls==='reach'||val.cls==='bad'?'REACH':val.cls==='nr'?'OFF LIST':'VALUE'}</small></span></td>
      <td class="log-player-cell"><b>${esc(name)}</b></td>
      <td>${esc(md.position||'—')}</td>
      <td>${esc(md.team||'—')}</td>
      <td>${esc(rosterOwnerName(p.roster_id,p.picked_by))}</td>
      <td>${esc(p.roster_id||'—')}</td>
    </tr>`;
  }).join('');
}
function renderDraftNeeds(){
  const el=$('#draftNeeds');if(!el)return;
  const liveRoster=(leagueRosters||[]).find(r=>String(r.roster_id)===String(sleeperCtx.rosterId));
  const livePlayers=liveRoster?(liveRoster.players||[]).map(sleeperRosterPlayer):[];
  const profile=livePlayers.length?{mine:livePlayers,counts:{QB:0,RB:0,WR:0,TE:0,K:0,DEF:0},total:livePlayers.length}:(typeof myRosterProfile==='function'?myRosterProfile():{mine:minePlayers(),counts:{QB:0,RB:0,WR:0,TE:0,K:0,DEF:0},total:0});
  if(livePlayers.length){livePlayers.forEach(p=>{if(profile.counts[p.pos]!==undefined)profile.counts[p.pos]++;});}
  else if(!profile.total){profile.mine.forEach(p=>{if(profile.counts[p.pos]!==undefined)profile.counts[p.pos]++;});profile.total=profile.mine.length;}
  const counts=profile.counts,needs=[],req=draftLineupRequirements();
  if(counts.QB<req.QB)needs.push([`Missing ${req.QB-counts.QB} starting QB${req.QB-counts.QB>1?'s':''}`,'warn']);
  if(counts.RB<req.RB)needs.push([`Missing ${req.RB-counts.RB} starting RB${req.RB-counts.RB>1?'s':''}`,'warn']);
  if(counts.WR<req.WR)needs.push([`Missing ${req.WR-counts.WR} starting WR${req.WR-counts.WR>1?'s':''}`,'warn']);
  if(req.TE>0&&counts.TE<req.TE)needs.push([`Missing ${req.TE-counts.TE} starting TE${req.TE-counts.TE>1?'s':''}`,'warn']);
  const flexEligible=counts.RB+counts.WR+counts.TE;
  if(flexEligible<draftFlexStarterFloor())needs.push(['W/R/T flex slot not covered','warn']);
  if(counts.K<req.K)needs.push(['K slot not covered','warn']);
  if(counts.DEF<req.DEF)needs.push(['DEF slot not covered','warn']);
  if(profile.total>=13)needs.push(['Roster depth established','ok']);
  if(!needs.length)needs.push(['Core starter positions covered','ok']);
  el.innerHTML=needs.map(n=>`<span class="need-chip ${n[1]}">${esc(n[0])}</span>`).join('');
}
