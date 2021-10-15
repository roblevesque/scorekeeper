var ScoreKeeper = (function() {
  var db = new Dexie("sk_db");
  db.version(1).stores({teams: "++id,&name", rounds: "++id,name,questions", totals: "++id,[round+team],points" })
  return {
    Database:(function(){
      return {
        export:async function(){
          const obj = await db.export({prettyJson: true})
          return obj
        }
      }
    })(),
    Teams:(function() {
        return {
          add:async function( query ) {
             new_id = await db.teams.put({name: query.name});
             return new_id;
          }, // End ScoreKeeper.Teams.add()
          list:Dexie.async(function* () {
            rteams = yield db.teams.toArray();
            return rteams;
          }), // End ScoreKeeper.Teams.list()
          get:async function(query) {
            let team = await db.teams.get(query);
            return team;
          }, // End ScoreKeeper.Teams.get()
          delete:function(team_id) {
            db.teams.delete(team_id)
          }, // End ScoreKeeper.Teams.delete()
          update:function(query) {
            db.teams.put(query)
          }, // End ScoreKeeper.Teams.update()
          clear:function() {
            db.teams.clear()
          }, // End ScoreKeeper.Teams.wipe_all()
        } // ScoreKeeper.Teams.return{}
      })(),
    Rounds:(function() {
        return {
          add:async function(query) {
            new_id = await  db.rounds.put({name: query.name, questions: query.questions})
            return new_id;
          }, // End ScoreKeeper.Rounds.add()
          list:Dexie.async(function* () {
            rounds = yield db.rounds.toArray();
            return rounds;
          }), // End ScoreKeeper.Teams.list()
          get:async function(query) {
            let round = await db.rounds.get(query);
            return round;
          }, // End ScoreKeeper.Rounds.get()
          delete:function(round_id) {
            db.rounds.delete(round_id)
          }, // End ScoreKeeper.Rounds.delete()
          update:function(query) {
            db.rounds.put(query)
          }, // End ScoreKeeper.Rounds.update()
          clear:function() {
            db.rounds.clear()
          }, // End ScoreKeeper.Teams.wipe_all()
        }
      })(),
    Totals: (function() {
        return {
          add:function(round_id, team_id, points) {
            db.totals.put({round: round_id, team: team_id, points: points})
          }, // End ScoreKeeper.Totals.add()
          list:Dexie.async(function* () {
            totals = yield db.totals.toArray();
            return totals;
          }), // End ScoreKeeper.Totals.list()
          get:async function(query) {
            let total = await db.totals.get(query);
            return total;
          }, // End ScoreKeeper.Totals.get()
          delete:function(total_id) {
            db.totals.delete(total_id)
          }, // End ScoreKeeper.Totals.delete()
          update:function(total_id,parameters) {
            db.totals.update(total_id, parameters)
          }, // End ScoreKeeper.Totals.update()
          clear:function() {
            db.totals.clear()
          }, // End ScoreKeeper.Totals.wipe_all()
          put:async function(pointobj) {
            existing = await db.totals.get({round: pointobj.round, team: pointobj.team})
            if ( existing != undefined ) {
                pointobj['id'] = existing.id
             }
            db.totals.put(pointobj)
          }, // End ScoreKeeper.Totals.put()

        }
      })(),

    } // ScoreKeeper.return()
  } ());
