
$(document).ready(function(){

//var env = new nunjucks.Environment();
var env= nunjucks.configure('')

env.addFilter('add', function(numbers) {
  try {
    return numbers.reduce(function(a,b) {return a+b})
  }
  catch { return 0; }
});


// Load Teams panel
 (async function () {
  teams =  await ScoreKeeper.Teams.list()
  $('#teams_panel').html( env.render('panels/teams.htm', {teams: teams }))
})();

// Load Rounds panel
(async function () {
 rounds =  await ScoreKeeper.Rounds.list()
 $('#rounds_panel').html( env.render('panels/rounds.htm', {rounds: rounds }))
})();

/// Load Scorecard
updateScoreSheets(env)


$(document).on('click', '.add-team', function() {
  line = `<tr>
    <td class="s1">
      <ul>
        <li><a href="#" class="delete-team"><i class="material-icons">remove</i></a></li>
      </ul>
    </td>
      <td>
      <input class="inline team-input" data-field="name" type="text" value=""> </input>
    </td>

    </tr>`;
    $('#teams-table').append(line)


});


$(document).on('click', '.delete-team', async function() {
    row = $(this).closest("tr")
    obj = await ScoreKeeper.Teams.get({name: $(this).closest("td").next().find('.team-input').val() })
    if (obj != undefined) {
      ScoreKeeper.Teams.delete(obj.id)
    }
    $(row).remove()

});


// Teams change handler
$(document).on('change', '.team-input', async function(){
  id = $(this).data('id')
  field = $(this).data('field')
  query = {}
  query[field] = $(this).val()
  if (id != undefined) {
    query.id = id
    ScoreKeeper.Teams.update(query)
  }
  else {
    let new_id = await ScoreKeeper.Teams.add(query)
    $(this).data('id', new_id)
  }
  updateScoreSheets(env)
});




$(document).on('click', '.add-round', function() {
  line = `<tr>
    <td class="s1">
      <ul>
        <li><a href="#" class="delete-round"><i class="material-icons">remove</i></a></li>
      </ul>
    </td>
      <td>
      <input class="inline rounds-input" data-field="name" type="text"  value=""> </input>
    </td>
    <td>
      <input class="rounds-input" type="number" data-field="questions" size="4" min="0" max="1000" placeholder="# of ?s">
    </td>
    </tr>`;
    $('#rounds-table').append(line)

});

$(document).on('click', '.add-question', function() {
  line = `<li class="collection-item"><b>Question [..]:</b> <input type='text'></input> </li>`
  $(this).parent().find('.questions').append(line)

});


$(document).on('click', '.delete-round', async function() {
    row = $(this).closest("tr")
    obj = await ScoreKeeper.Rounds.get({name: $(this).closest("td").next().find('.rounds-input').val() })
    if (obj != undefined) {
      ScoreKeeper.Rounds.delete(obj.id)
    }
    $(row).remove()

});


// Scorecard change handler
$(document).on('change', '.scorecard-input', async function() {
  pointobj = {}
  pointobj['round'] = $(this).data('round')
  pointobj['team'] = $(this).data('team')
  points = []
  $(this).parent().parent().find('.scorecard-input').each(function(index, value) {
      points[$(this).data('question')] =  parseInt($(this).val())
  })
  pointobj['points'] = points

  await ScoreKeeper.Totals.put(pointobj)
  updateFinalScoresheet(env)

});



// Rounds change handler
$(document).on('change', '.rounds-input', async function(){
  id = $(this).data('id')
  query = {}
  $(this).closest('tr').find('input').each(function(index,value) {
    field = $(value).data('field')
      query[field] = $(value).val()
  });


  if (id != undefined ) {
    query.id = id
    ScoreKeeper.Rounds.update(query)
  }
  else {
    let new_id = await ScoreKeeper.Rounds.add(query)
    $(this).data('id', new_id)
    $(this).closest('tr').find('input').each(function(index,value) {
      $(this).data('id',new_id)
    });
  }

  updateScoreSheets(env)
});



$('.invisibletab').tabs();
});



async function updateScoreSheets(env) {
   rounds =  await ScoreKeeper.Rounds.list()
   teams = await ScoreKeeper.Teams.list()
   totals = await ScoreKeeper.Totals.list()
   teams.forEach((team, i) => {
     point_data = {}
     total_data = []
     totals.forEach((total, j) => {
       if ( total.team == team.id ) {
         point_data[total.round] = total.points
         total_data[total.round] = total.points.reduce(function(a,b){return a+b;})
       }
     });
     teams[i]['point_data'] = point_data
     teams[i]['total_data'] = total_data
   });

   $('#scorecard_panel').html(env.render('panels/scorecard.htm', {rounds: rounds, teams: teams, totals: totals}))
   updateFinalScoresheet(env)
}

async function updateFinalScoresheet(env) {
  rounds =  await ScoreKeeper.Rounds.list()
  teams = await ScoreKeeper.Teams.list()
  totals = await ScoreKeeper.Totals.list()
  teams.forEach((team, i) => {
    point_data = {}
    total_data = []
    totals.forEach((total, j) => {
      if ( total.team == team.id ) {
        point_data[total.round] = total.points
        try {
          total_data[total.round] = total.points.reduce(function(a,b){return a+b;})
        } catch {
          total_data[total.round] = 0
        }
      }

    });
    teams[i]['point_data'] = point_data
    teams[i]['total_data'] = total_data
  });

  teams_sorted = teams.sort(function(a,b) {
    try {
      a_s = a.total_data.reduce(function(a,b) {return a+b;} );
    }
    catch {
      a_s = 0
    }
    try {
      b_s = b.total_data.reduce(function(a,b) {return a+b;});
    }
    catch {
      b_s = 0
    }
    if ( a_s > b_s ){
      return -1;
    }
    if ( a_s < b_s ){
      return 1;
    }
  else {
      return 0;
    }
  });
  teams_sorted.forEach((item, i) => {
    teams_sorted[i].pos = i+1
    try {
    if ( i != 0 ) {
      a = item.total_data.reduce(function(a,b) {return a+b;});
      b = teams_sorted[i-1].total_data.reduce(function(a,b) {return a+b;})
      if (a == b ){
        teams_sorted[i].pos = teams_sorted[i-1].pos
      }
    }
  } catch {}
  });

  $('#final-sheet').html(env.render('panels/scorecard_final.htm', {rounds: rounds, teams: teams, totals: totals, teams_sorted:teams_sorted}))
}
