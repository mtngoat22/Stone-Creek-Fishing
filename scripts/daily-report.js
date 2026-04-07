// Daily Fishing Report — posts "What's Biting" for EVERY spot
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function buildReport(spot, month) {
  const species = spot.species || [];
  if (!species.length) return null;
  const name = spot.name || '';
  const desc = (spot.description || '').toLowerCase();

  const isWinter = month === 11 || month === 0 || month === 1;
  const isSpring = month >= 2 && month <= 4;
  const isSummer = month >= 5 && month <= 7;
  const isFall = month >= 8 && month <= 10;

  // Alpine lakes are snowed in Oct-May
  const isAlpine = /alpine|backcountry|high.elevation|8,?\d{3}|9,?\d{3}|10,?\d{3}|mountain/i.test(desc) ||
                   /granddaddy|trial|mirror|washington|lofty|boulder|tony grove|silver lake|lofty|island lake|kidney|dean|brown duck/i.test(name);

  if (isAlpine && (isWinter || month === 2 || month === 3 || month === 10)) {
    return {
      species: species[0],
      biting_on: "Still snowed in — plan a summer trip",
      method: "Fly",
      bite_rating: "slow",
      time_of_day: "N/A",
      notes: "High-elevation water. Access typically opens June-September. Check road and trail conditions."
    };
  }

  const main = species[0];
  const s = main.toLowerCase();

  // Trout (rainbow, brown, cutthroat, brook, tiger, splake)
  if (/trout|splake/.test(s)) {
    if (isWinter) {
      // River trout = midges, reservoir trout = ice fishing
      if (/river|creek|stream|fork/i.test(name)) {
        return { species: main, biting_on: "Midges #22-26, egg patterns #16", method: "Nymph", bite_rating: "fair", time_of_day: "11am-1pm", notes: "Winter trout fishing. Slow and deep. Fish the midday window." };
      }
      return { species: main, biting_on: "Small jigs tipped with mealworms, PowerBait through ice", method: "Ice Fishing", bite_rating: "fair", time_of_day: "Midday", notes: "Ice fishing season. Check ice thickness before venturing out." };
    }
    if (isSpring) {
      if (/river|creek|stream|fork/i.test(name)) {
        return { species: main, biting_on: "BWO #20-24, Pheasant Tail Nymph #18, Hares Ear #16", method: "Dry Fly", bite_rating: "good", time_of_day: "11am-3pm", notes: "Spring BWO hatches building. Great dry fly time." };
      }
      return { species: main, biting_on: "PowerBait chartreuse, nightcrawlers, Kastmaster spoon", method: "Bait", bite_rating: "good", time_of_day: "Morning", notes: "Spring stocking season. Fish near inlets and shallows." };
    }
    if (isSummer) {
      if (/river|creek|stream|fork/i.test(name)) {
        return { species: main, biting_on: "Elk Hair Caddis #16, Hopper #10, PMD #16", method: "Dry Fly", bite_rating: "good", time_of_day: "Evening", notes: "Summer dry fly fishing. Fish the evening hatches." };
      }
      return { species: main, biting_on: "PowerBait, worms, trolled pop gear with worms", method: "Trolling", bite_rating: "good", time_of_day: "Early morning", notes: "Fish early before the heat. Go deeper as summer progresses." };
    }
    if (isFall) {
      if (/river|creek|stream|fork/i.test(name)) {
        return { species: main, biting_on: "Streamers #6-8, BWO #20-22, egg patterns", method: "Streamer", bite_rating: "good", time_of_day: "Morning", notes: "Fall trout feeding. Streamers for the big ones." };
      }
      return { species: main, biting_on: "PowerBait, nightcrawlers, Kastmaster spoon", method: "Bait", bite_rating: "good", time_of_day: "Midday", notes: "Fall feeding before winter. Shore fishing productive." };
    }
  }

  // Lake Trout / Mackinaw
  if (/lake trout|mackinaw/.test(s)) {
    if (isSummer) return { species: main, biting_on: "Downrigger trolled spoons 60-100ft deep", method: "Trolling", bite_rating: "good", time_of_day: "Morning", notes: "Lakers go deep in summer." };
    return { species: main, biting_on: "Tube jigs 1/2-1oz worked 80-120ft", method: "Jigging", bite_rating: "good", time_of_day: "All day", notes: "Work drop-offs and structure with electronics." };
  }

  // Bass
  if (/bass/.test(s)) {
    if (isWinter) return { species: main, biting_on: "Blade baits, jigging spoons near deep structure", method: "Jigging", bite_rating: "slow", time_of_day: "Midday", notes: "Winter bass are sluggish. Fish deep and slow." };
    if (isSpring) return { species: main, biting_on: "Senkos, spinnerbaits, jigs near rocks", method: "Lure", bite_rating: "good", time_of_day: "Afternoon", notes: "Bass moving shallow for spawn. Sight fishing possible." };
    if (isSummer) return { species: main, biting_on: "Topwater poppers, Senkos, crankbaits", method: "Lure", bite_rating: "hot", time_of_day: "Early morning", notes: "Peak bass season! Fish dawn and dusk." };
    if (isFall) return { species: main, biting_on: "Crankbaits, jigs, swimbaits on points", method: "Lure", bite_rating: "good", time_of_day: "Morning", notes: "Fall bass feeding up before winter." };
  }

  // Walleye
  if (/walleye/.test(s)) {
    if (isWinter) return { species: main, biting_on: "Jigging spoons, blade baits on bottom", method: "Jigging", bite_rating: "fair", time_of_day: "Dusk", notes: "Slow winter bite but possible at dusk." };
    if (isSummer) return { species: main, biting_on: "Nightcrawler harnesses trolled 15-25ft", method: "Trolling", bite_rating: "good", time_of_day: "Evening", notes: "Troll rocky points at dusk." };
    return { species: main, biting_on: "Jigs with minnows, blade baits, nightcrawlers", method: "Bait", bite_rating: "good", time_of_day: "Evening", notes: "Fish rocky shorelines near dam." };
  }

  // Perch
  if (/perch/.test(s)) {
    if (isWinter) return { species: main, biting_on: "Small tungsten jigs with waxworms through ice", method: "Ice Fishing", bite_rating: "good", time_of_day: "Morning", notes: "Perch school up. Drill multiple holes to find them." };
    return { species: main, biting_on: "Small jigs with waxworms, drop shot with worm", method: "Bait", bite_rating: "good", time_of_day: "Morning", notes: "Find the schools over structure." };
  }

  // Catfish
  if (/catfish/.test(s)) {
    if (isWinter) return { species: main, biting_on: "Nightcrawlers on bottom (slow winter bite)", method: "Bait", bite_rating: "slow", time_of_day: "Evening", notes: "Catfish slow in cold water." };
    if (isSummer) return { species: main, biting_on: "Chicken liver, hot dogs, nightcrawlers on bottom", method: "Bait", bite_rating: "hot", time_of_day: "Night", notes: "Peak catfish season! Fish after dark." };
    return { species: main, biting_on: "Nightcrawlers, stink bait on bottom", method: "Bait", bite_rating: "good", time_of_day: "Evening", notes: "Fish after sunset for best results." };
  }

  // Bluegill / panfish
  if (/bluegill|sunfish|crappie/.test(s)) {
    if (isWinter) return { species: main, biting_on: "Small tungsten jigs with waxworms", method: "Ice Fishing", bite_rating: "fair", time_of_day: "Midday", notes: "Slower winter bite but possible through ice." };
    return { species: main, biting_on: "Worms under bobber, small jigs, crickets", method: "Bait", bite_rating: "good", time_of_day: "Afternoon", notes: "Fun on ultralight gear. Great for kids." };
  }

  // Kokanee
  if (/kokanee/.test(s)) {
    if (isFall) return { species: main, biting_on: "Wedding Ring spinners trolled 15ft", method: "Trolling", bite_rating: "good", time_of_day: "Morning", notes: "Fall kokanee run — great time to target them." };
    return { species: main, biting_on: "Small spoons trolled 20-40ft with downriggers", method: "Trolling", bite_rating: "fair", time_of_day: "Morning", notes: "Troll deep with bright colors." };
  }

  // Wiper
  if (/wiper/.test(s)) {
    return { species: main, biting_on: "Crankbaits, swimbaits, topwater poppers", method: "Lure", bite_rating: "good", time_of_day: "Evening", notes: "Wipers hit hard. Fast retrieve." };
  }

  // White bass
  if (/white bass/.test(s)) {
    if (isSpring) return { species: main, biting_on: "Small white jigs, crankbaits in tributaries", method: "Lure", bite_rating: "hot", time_of_day: "Morning", notes: "Spring spawning run!" };
    return { species: main, biting_on: "White jigs, small spinners", method: "Lure", bite_rating: "good", time_of_day: "Morning", notes: "Schools move fast — stay mobile." };
  }

  // Whitefish
  if (/whitefish/.test(s)) {
    return { species: main, biting_on: "Sow bugs #18-22, small nymphs", method: "Nymph", bite_rating: "good", time_of_day: "Midday", notes: "Underrated. Fun on light tackle." };
  }

  // Generic fallback
  return {
    species: main,
    biting_on: "Worms, PowerBait, small lures",
    method: "Bait",
    bite_rating: "fair",
    time_of_day: "Morning",
    notes: "General fishing report. Try multiple presentations."
  };
}

async function run() {
  console.log('🐟 Stone Creek Fishing — Daily Report v4');
  console.log('Date:', new Date().toISOString());
  const month = new Date().getMonth();
  const today = new Date().toISOString().split('T')[0];

  const { data: spots, error } = await supabase.from('spots').select('id, name, species, description');
  if (error) { console.error('Load error:', error); return; }
  console.log(`Loaded ${spots.length} spots`);

  // Get today's existing reports to avoid duplicates
  const { data: existing } = await supabase.from('biting_reports')
    .select('spot_id, species').eq('reported_at', today);
  const done = new Set((existing || []).map(e => `${e.spot_id}-${e.species}`));
  console.log(`${done.size} reports already posted today`);

  let posted = 0, skipped = 0, errors = 0;

  for (const spot of spots) {
    const r = buildReport(spot, month);
    if (!r) { console.log(`  ⏭️ ${spot.name}: no species defined`); skipped++; continue; }

    const key = `${spot.id}-${r.species}`;
    if (done.has(key)) { console.log(`  ⏭️ ${spot.name}: already posted ${r.species} today`); skipped++; continue; }

    const { error: insErr } = await supabase.from('biting_reports').insert({
      user_id: null,
      spot_id: spot.id,
      species: r.species,
      biting_on: r.biting_on,
      method: r.method,
      bite_rating: r.bite_rating,
      time_of_day: r.time_of_day,
      notes: `📋 ${r.notes} (Auto-report)`,
      reported_at: today,
    });

    if (insErr) {
      console.error(`  ❌ ${spot.name}: ${insErr.message}`);
      errors++;
    } else {
      console.log(`  ✅ ${spot.name}: ${r.species}`);
      posted++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Posted: ${posted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
