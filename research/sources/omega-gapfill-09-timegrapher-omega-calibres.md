Source: https://raw.githubusercontent.com/peterhudson/timegrapher/main/crates/timegrapher-core/data/train-wheels.json
Title: 
Fetched: 2026-11-24T20:25:36.260Z
Truncated: continue from startIndex 250000

[
  {
    "calibre": "ETA 2824-2",
    "maker": "ETA",
    "family": [
      "2824",
      "2824-2 (clone)",
      "ETA 2824-2 (28800 bph)"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 50,
    "seconds": "centre, direct (fourth wheel at the centre)",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 21114.027149321268,
        "teeth": 101,
        "basis": "Counted in supplied ETA 2824 photographs; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md."
      },
      {
        "name": "centre wheel",
        "period_s": 3553.846153846154,
        "teeth": 77,
        "basis": "Counted in supplied ETA 2824 photographs; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 17
      },
      {
        "name": "third wheel",
        "period_s": 600.0,
        "teeth": 90,
        "basis": "Counted in supplied ETA 2824 photographs; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 13
      },
      {
        "name": "fourth wheel",
        "period_s": 60.0,
        "teeth": 108,
        "basis": "Counted in supplied ETA 2824 photographs; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "Counted in supplied ETA 2824 photographs; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "cannon pinion",
        "period_s": 3600.0,
        "teeth": 78,
        "basis": "Counted in supplied ETA 2824 photographs; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md. 78-tooth driver wheel and 16-leaf cannon pinion share the one-hour arbor; third-to-cannon mesh inferred from exact ratio, not bench-confirmed.",
        "pinion": 16
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from 28800 bph"
      }
    ],
    "sources": [
      "https://17jewels.info/movements/e/eta/eta-2824-2/ (20-tooth steel escape wheel, direct centre seconds, no true centre wheel)",
      "https://www.uhrwerksarchiv.de/movements/e/eta/eta-2824-2/",
      "https://www.awci.com/wp-content/uploads/2013/10/TomsTips_Web_Nov13.pdf (lift angle table)",
      "https://en.wikipedia.org/wiki/List_of_ETA_Movements",
      "https://watchguy.co.uk/cgi-bin/lift_angles (ETA 2824-2, 50°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (ETA 2824-2, 50°, 28800 vph)",
      "docs/research/2824-train-wheel-counts.md (Peter Hudson microscope photographs, 2026-10-19; counted base train, explicit variant applicability)",
      "https://www.phfactor.net/wtf/ETA/29_ETA2801.2-ETA2836.2.pdf",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: its sister movements now have their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date. Its sister movements on the same train have their own rows (#1822). 28,800 bph 2824 base train only. The centre wheel slot denotes the off-centre second/intermediate wheel (77/17), not the one-hour cannon pinion. The third pinion (13) drives the cannon wheel (78): 600 x 78/13 = 3600 s. Barrel running period is 4666200/221 s; this is not power reserve. See the evidence document for applicability and exclusions. Family aliases use contributor-reported applicability."
  },
  {
    "calibre": "ETA 2834-2",
    "maker": "ETA",
    "family": [
      "2834-2"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 50,
    "seconds": "centre, direct (fourth wheel at the centre)",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 21114.027149321268,
        "teeth": 101,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md."
      },
      {
        "name": "centre wheel",
        "period_s": 3553.846153846154,
        "teeth": 77,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 17
      },
      {
        "name": "third wheel",
        "period_s": 600.0,
        "teeth": 90,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 13
      },
      {
        "name": "fourth wheel",
        "period_s": 60.0,
        "teeth": 108,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "cannon pinion",
        "period_s": 3600.0,
        "teeth": 78,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md. 78-tooth driver wheel and 16-leaf cannon pinion share the one-hour arbor; third-to-cannon mesh inferred from exact ratio, not bench-confirmed.",
        "pinion": 16
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from 28800 bph"
      }
    ],
    "sources": [
      "https://calibercorner.com/eta-caliber-2836-2 (2836-2: day-date on the 2824-2 base, date at 3 with the day beside it, abbreviated; 2834-2: similar, with a panoramic day at 12 spelled out; 28,800 bph)",
      "https://17jewels.info/movements/e/eta/eta-2824-2/ (20-tooth steel escape wheel, direct centre seconds, no true centre wheel)",
      "https://www.uhrwerksarchiv.de/movements/e/eta/eta-2824-2/",
      "https://www.awci.com/wp-content/uploads/2013/10/TomsTips_Web_Nov13.pdf (lift angle table)",
      "https://en.wikipedia.org/wiki/List_of_ETA_Movements",
      "https://watchguy.co.uk/cgi-bin/lift_angles (ETA 2824-2, 50°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (ETA 2824-2, 50°, 28800 vph)",
      "docs/research/2824-train-wheel-counts.md (Peter Hudson microscope photographs, 2026-10-19; counted base train, explicit variant applicability)",
      "https://www.phfactor.net/wtf/ETA/29_ETA2801.2-ETA2836.2.pdf",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "inferred family transfer",
    "notes": "Day and date, the day spelled out at 12. Shares the going train, escapement, beat rate and lift setting of ETA 2824-2, from which it was split on 2026-11-15 (#1822); only the motion works differ. 28,800 bph 2824 base train only. The centre wheel slot denotes the off-centre second/intermediate wheel (77/17), not the one-hour cannon pinion. The third pinion (13) drives the cannon wheel (78): 600 x 78/13 = 3600 s. Barrel running period is 4666200/221 s; this is not power reserve. See the evidence document for applicability and exclusions. Family aliases use contributor-reported applicability."
  },
  {
    "calibre": "ETA 2836-2",
    "maker": "ETA",
    "family": [
      "2836-2"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 50,
    "seconds": "centre, direct (fourth wheel at the centre)",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 21114.027149321268,
        "teeth": 101,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md."
      },
      {
        "name": "centre wheel",
        "period_s": 3553.846153846154,
        "teeth": 77,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 17
      },
      {
        "name": "third wheel",
        "period_s": 600.0,
        "teeth": 90,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 13
      },
      {
        "name": "fourth wheel",
        "period_s": 60.0,
        "teeth": 108,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "cannon pinion",
        "period_s": 3600.0,
        "teeth": 78,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md. 78-tooth driver wheel and 16-leaf cannon pinion share the one-hour arbor; third-to-cannon mesh inferred from exact ratio, not bench-confirmed.",
        "pinion": 16
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from 28800 bph"
      }
    ],
    "sources": [
      "https://calibercorner.com/eta-caliber-2836-2 (2836-2: day-date on the 2824-2 base, date at 3 with the day beside it, abbreviated; 2834-2: similar, with a panoramic day at 12 spelled out; 28,800 bph)",
      "https://17jewels.info/movements/e/eta/eta-2824-2/ (20-tooth steel escape wheel, direct centre seconds, no true centre wheel)",
      "https://www.uhrwerksarchiv.de/movements/e/eta/eta-2824-2/",
      "https://www.awci.com/wp-content/uploads/2013/10/TomsTips_Web_Nov13.pdf (lift angle table)",
      "https://en.wikipedia.org/wiki/List_of_ETA_Movements",
      "https://watchguy.co.uk/cgi-bin/lift_angles (ETA 2824-2, 50°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (ETA 2824-2, 50°, 28800 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (ETA 2836-2, 50°)",
      "docs/research/2824-train-wheel-counts.md (Peter Hudson microscope photographs, 2026-10-19; counted base train, explicit variant applicability)",
      "https://www.phfactor.net/wtf/ETA/29_ETA2801.2-ETA2836.2.pdf",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "inferred family transfer",
    "notes": "Day and date, the day beside the date at 3. Shares the going train, escapement, beat rate and lift setting of ETA 2824-2, from which it was split on 2026-11-15 (#1822); only the motion works differ. 28,800 bph 2824 base train only. The centre wheel slot denotes the off-centre second/intermediate wheel (77/17), not the one-hour cannon pinion. The third pinion (13) drives the cannon wheel (78): 600 x 78/13 = 3600 s. Barrel running period is 4666200/221 s; this is not power reserve. See the evidence document for applicability and exclusions. Family aliases use contributor-reported applicability."
  },
  {
    "calibre": "Sellita SW200-1",
    "maker": "Sellita",
    "family": [
      "SW200",
      "SW200-1",
      "SW200-1 a",
      "SW200-1 b"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "seconds": "centre, direct (fourth wheel at the centre)",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 21114.027149321268,
        "teeth": 101,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md."
      },
      {
        "name": "centre wheel",
        "period_s": 3553.846153846154,
        "teeth": 77,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 17
      },
      {
        "name": "third wheel",
        "period_s": 600.0,
        "teeth": 90,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 13
      },
      {
        "name": "fourth wheel",
        "period_s": 60.0,
        "teeth": 108,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "cannon pinion",
        "period_s": 3600.0,
        "teeth": 78,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md. 78-tooth driver wheel and 16-leaf cannon pinion share the one-hour arbor; third-to-cannon mesh inferred from exact ratio, not bench-confirmed.",
        "pinion": 16
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from 28800 bph"
      }
    ],
    "sources": [
      "https://17jewels.info/movements/e/eta/eta-2824-2/ (the 2824-2 it copies)",
      "https://reference.grail-watch.com/2020/03/02/further-sellita-research-sw300-and-more/ (SW220-1 is the day-date SW200-1, as the 2836-2 is the 2824-2's)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Sellita SW200, 50°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Sellita SW200-1, 50°)",
      "docs/research/2824-train-wheel-counts.md (Peter Hudson microscope photographs, 2026-10-19; counted base train, explicit variant applicability)",
      "https://www.sellita.ch/images/documents/Catalogue2024_ENG.pdf",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: its sister movements now have their own rows)"
    ],
    "confidence": "inferred family transfer",
    "notes": "Date. Its sister movements on the same train have their own rows (#1822). 28,800 bph 2824 base train only. The centre wheel slot denotes the off-centre second/intermediate wheel (77/17), not the one-hour cannon pinion. The third pinion (13) drives the cannon wheel (78): 600 x 78/13 = 3600 s. Barrel running period is 4666200/221 s; this is not power reserve. See the evidence document for applicability and exclusions. Train counts are transferred from the photographed base, not separately measured on this variant.",
    "lift_angle_deg": 50.0,
    "assets": [
      {
        "path": "sellita/shared/Catalogue2024_ENG.pdf",
        "kind": "spec sheet"
      }
    ]
  },
  {
    "calibre": "Sellita SW220-1",
    "maker": "Sellita",
    "family": [
      "SW220",
      "SW220-1"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "seconds": "centre, direct (fourth wheel at the centre)",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 21114.027149321268,
        "teeth": 101,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md."
      },
      {
        "name": "centre wheel",
        "period_s": 3553.846153846154,
        "teeth": 77,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 17
      },
      {
        "name": "third wheel",
        "period_s": 600.0,
        "teeth": 90,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 13
      },
      {
        "name": "fourth wheel",
        "period_s": 60.0,
        "teeth": 108,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "cannon pinion",
        "period_s": 3600.0,
        "teeth": 78,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md. 78-tooth driver wheel and 16-leaf cannon pinion share the one-hour arbor; third-to-cannon mesh inferred from exact ratio, not bench-confirmed.",
        "pinion": 16
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from 28800 bph"
      }
    ],
    "sources": [
      "https://reference.grail-watch.com/movement/sw220-1/amp (automatic with day and date; equivalent to the ETA 2836-2; SW200 family)",
      "https://17jewels.info/movements/e/eta/eta-2824-2/ (the 2824-2 it copies)",
      "https://reference.grail-watch.com/2020/03/02/further-sellita-research-sw300-and-more/ (SW220-1 is the day-date SW200-1, as the 2836-2 is the 2824-2's)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Sellita SW200, 50°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Sellita SW200-1, 50°)",
      "docs/research/2824-train-wheel-counts.md (Peter Hudson microscope photographs, 2026-10-19; counted base train, explicit variant applicability)",
      "https://www.sellita.ch/images/documents/Catalogue2024_ENG.pdf",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "inferred family transfer",
    "notes": "Day and date (the SW200-1 with the 2836-2's calendar). Shares the going train, escapement, beat rate and lift setting of Sellita SW200-1, from which it was split on 2026-11-15 (#1822); only the motion works differ. 28,800 bph 2824 base train only. The centre wheel slot denotes the off-centre second/intermediate wheel (77/17), not the one-hour cannon pinion. The third pinion (13) drives the cannon wheel (78): 600 x 78/13 = 3600 s. Barrel running period is 4666200/221 s; this is not power reserve. See the evidence document for applicability and exclusions. Train counts are transferred from the photographed base, not separately measured on this variant.",
    "lift_angle_deg": 50.0,
    "assets": [
      {
        "path": "sellita/shared/Catalogue2024_ENG.pdf",
        "kind": "spec sheet"
      }
    ]
  },
  {
    "calibre": "Sellita SW240-1",
    "maker": "Sellita",
    "family": [
      "SW240",
      "SW240-1"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "seconds": "centre, direct (fourth wheel at the centre)",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 21114.027149321268,
        "teeth": 101,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md."
      },
      {
        "name": "centre wheel",
        "period_s": 3553.846153846154,
        "teeth": 77,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 17
      },
      {
        "name": "third wheel",
        "period_s": 600.0,
        "teeth": 90,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 13
      },
      {
        "name": "fourth wheel",
        "period_s": 60.0,
        "teeth": 108,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "cannon pinion",
        "period_s": 3600.0,
        "teeth": 78,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md. 78-tooth driver wheel and 16-leaf cannon pinion share the one-hour arbor; third-to-cannon mesh inferred from exact ratio, not bench-confirmed.",
        "pinion": 16
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from 28800 bph"
      }
    ],
    "sources": [
      "https://watchbase.com/sellita/caliber/sw240-1 (hours, minutes, centre seconds, day and date with quick setting; 28800; base SW200-1 a)",
      "https://17jewels.info/movements/e/eta/eta-2824-2/ (the 2824-2 it copies)",
      "https://reference.grail-watch.com/2020/03/02/further-sellita-research-sw300-and-more/ (SW220-1 is the day-date SW200-1, as the 2836-2 is the 2824-2's)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Sellita SW200, 50°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Sellita SW200-1, 50°)",
      "docs/research/2824-train-wheel-counts.md (Peter Hudson microscope photographs, 2026-10-19; counted base train, explicit variant applicability)",
      "https://www.sellita.ch/images/documents/Catalogue2024_ENG.pdf",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "inferred family transfer",
    "notes": "Day and date. Shares the going train, escapement, beat rate and lift setting of Sellita SW200-1, from which it was split on 2026-11-15 (#1822); only the motion works differ. 28,800 bph 2824 base train only. The centre wheel slot denotes the off-centre second/intermediate wheel (77/17), not the one-hour cannon pinion. The third pinion (13) drives the cannon wheel (78): 600 x 78/13 = 3600 s. Barrel running period is 4666200/221 s; this is not power reserve. See the evidence document for applicability and exclusions. Train counts are transferred from the photographed base, not separately measured on this variant.",
    "lift_angle_deg": 50.0,
    "assets": [
      {
        "path": "sellita/shared/Catalogue2024_ENG.pdf",
        "kind": "spec sheet"
      }
    ]
  },
  {
    "calibre": "ETA 2892-A2",
    "maker": "ETA",
    "family": [
      "2892",
      "2892-2"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 51,
    "seconds": "centre",
    "wheels": [
      {
        "name": "seconds wheel",
        "period_s": 60,
        "basis": "derived: the seconds hand turns once a minute"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://ranfft.org/caliber/4232-ETA-2892 (lift 53°)",
      "https://www.awci.com/wp-content/uploads/2013/10/TomsTips_Web_Nov13.pdf (lift 51°)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: its sister movements now have their own rows)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "Date. Its sister movements on the same train have their own rows (#1822). Whether the seconds are driven directly by the fourth wheel was not confirmed, and the escape wheel's tooth count was not found, so neither the fourth wheel nor the escape wheel is named. 42 h power reserve. Lift angle: 51° in the AWCI table, 53° on Ranfft. The Sellita SW300-1 is a copy; its lift angle is not documented separately."
  },
  {
    "calibre": "Sellita SW300-1",
    "maker": "Sellita",
    "family": [
      "SW300",
      "SW300-1"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 51,
    "seconds": "centre",
    "wheels": [
      {
        "name": "seconds wheel",
        "period_s": 60,
        "basis": "derived: the seconds hand turns once a minute"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://reference.grail-watch.com/2020/03/02/further-sellita-research-sw300-and-more/ (the SW300-1 is a clone of the ETA 2892A2)",
      "https://ranfft.org/caliber/4232-ETA-2892 (lift 53°)",
      "https://www.awci.com/wp-content/uploads/2013/10/TomsTips_Web_Nov13.pdf (lift 51°)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "A Sellita copy of the ETA 2892-A2. Shares the going train, escapement, beat rate and lift setting of ETA 2892-A2, from which it was split on 2026-11-15 (#1822); only the motion works differ. Whether the seconds are driven directly by the fourth wheel was not confirmed, and the escape wheel's tooth count was not found, so neither the fourth wheel nor the escape wheel is named. 42 h power reserve. Lift angle: 51° in the AWCI table, 53° on Ranfft. The Sellita SW300-1 is a copy; its lift angle is not documented separately."
  },
  {
    "calibre": "Valjoux 7750",
    "maker": "ETA",
    "family": [
      "7750",
      "ETA 7750",
      "Sellita SW500",
      "SW500"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 49,
    "seconds": "small seconds at 9 (fourth wheel)",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "derived: carries the small seconds"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://atelierhorlogerie.com/wp-content/uploads/2013/04/the-valjoux-7750-chronograph-doc.pdf (Odets: off-centre centre wheel, indirect motion work, chronograph driven from the fourth wheel)",
      "https://www.awci.com/wp-content/uploads/2013/10/TomsTips_Web_Nov13.pdf (lift 49°)",
      "https://en.wikipedia.org/wiki/Valjoux_7750",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Valjoux 7750, 49°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (ETA 7750, 49°)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "Lift angle: 49° in the AWCI table, 50° is also widely used. The centre wheel is off centre and the motion work is driven through an intermediate wheel, so its period is left out. Escape wheel tooth count not found. Some early 7750s ran at 21,600 bph; this entry is the 28,800 version. 'Daytona 4130' clones built on a 7750 base use this train plus extra wheels to move the small seconds to 6."
  },
  {
    "calibre": "Unitas 6497-2",
    "maker": "ETA",
    "family": [
      "6497",
      "6497-2",
      "6498",
      "6498-2",
      "Unitas 6498-2",
      "ETA 6497-2",
      "ETA 6498-2"
    ],
    "common": true,
    "bph": 21600,
    "escape_teeth": 15,
    "lift_angle_deg": 44,
    "seconds": "small seconds (6497 at 9, 6498 at 6), fourth wheel",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 15,
        "pinion": 10,
        "basis": "derived from tooth counts"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 8,
        "basis": "derived from tooth counts"
      },
      {
        "name": "third wheel",
        "period_s": 450,
        "teeth": 60,
        "pinion": 10,
        "basis": "derived from tooth counts"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "basis": "derived from tooth counts"
      },
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "http://horology-student.org/movements/modern-eta-and-clones/unitas-eta-6497-6498/ (tooth counts, from ETA's training version)",
      "https://www.awci.com/wp-content/uploads/2013/10/TomsTips_Web_Nov13.pdf (lift 44°)",
      "https://en.wikipedia.org/wiki/List_of_ETA_Movements",
      "https://watchguy.co.uk/cgi-bin/lift_angles (ETA 6497, 44°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (ETA 6497, 44°)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "The only calibre here with a published train: escape 15 teeth on a 10-leaf pinion, fourth 120/8, third 60/10, centre 80 teeth (centre pinion and barrel not found, so the barrel is left out). The counts fit 21,600 bph, the -2 versions. The -1 versions run at 18,000 bph with a train not found; they are not in this entry. 56 h power reserve."
  },
  {
    "calibre": "Seagull ST36",
    "maker": "Tianjin Seagull",
    "family": [
      "ST3600",
      "ST3621",
      "ST 36"
    ],
    "common": true,
    "bph": 21600,
    "seconds": "small seconds (ST3600 at 9, ST3621 at 6), fourth wheel",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "derived: carries the small seconds"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "basis": "derived from the beat rate"
      },
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://reference.grail-watch.com/movement/st36/amp/",
      "https://calibercorner.com/seagull-caliber-st3621",
      "https://en.seagullwatch.com/products/small-second-movement-ty3600-st3600 (Maker's page) (\"Frequency: 21600 (no unit stated on page)\")"
    ],
    "confidence": "derived from the beat rate",
    "notes": "A copy of the Unitas 6497/6498; it probably shares the 6497-2 train (escape 5 s, third wheel 450 s) but no source confirms it, so those wheels are left out. Lift angle not documented (44° as the 6497 is often used)."
  },
  {
    "calibre": "Powermatic 80",
    "maker": "ETA",
    "family": [
      "C07.111",
      "C07.611",
      "ETA C07",
      "C07",
      "H-10",
      "Powermatic 80.111"
    ],
    "common": true,
    "bph": 21600,
    "seconds": "centre",
    "wheels": [
      {
        "name": "seconds wheel",
        "period_s": 60,
        "basis": "derived: the seconds hand turns once a minute"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://www.watchuseek.com/threads/questions-about-eta-c07-powermatic-80-h-10-etc.5104577/",
      "https://ranfft.org/caliber/12742-ETA-C07-111 (Ranfft: ETA C07.111, read 2026-11-17) (21600 bph)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "80 h power reserve from a slimmer barrel arbor with a longer mainspring and a slower beat, on the 2824 architecture. No tooth counts, escape wheel count or lift angle found (the C07.111 uses a synthetic escape wheel and pallet fork, the C07.611 a conventional one)."
  },
  {
    "calibre": "Rolex 3135",
    "maker": "Rolex",
    "family": [
      "3135",
      "Rolex 31xx"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel, the 'seconds wheel' 3135-360)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://calibercorner.com/rolex-caliber-3135/",
      "https://patents.google.com/patent/US8529122 (a standard 20-tooth Swiss lever as the baseline)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (the 313x's 5:1 barrel to minute ratio)",
      "https://watchesbysjx.com/2024/08/geometric-efficiency-escapements.html",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://en.watch-spare.com/rolex-cal-3135-escape-wheel-410-rx-3135-410.html (lift 52°)",
      "https://gleave.london/seconds-wheel-fourth-wheel-rolex-3135-360-generic/",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3135, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3135, 52°)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://giacatwatch.com/wp-content/uploads/2024/03/CALIBER-3135-3155-3175-3185-TECHNICAL-INFORMATION-1.pdf (Rolex technical information: 3135 at 28,800 bph and 52° lift)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: its sister movements now have their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date. Its sister movements on the same train have their own rows (#1822). Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Existing 52° lift setting retained; the Rolex technical manual publishes 52° for 3135."
  },
  {
    "calibre": "Rolex 3130",
    "maker": "Rolex",
    "family": [
      "3130"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel, the 'seconds wheel' 3135-360)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://www.bqwatches.com/movements/rolex/calibre-3130 (hours, minutes, seconds; 28,800 vph; about 48 h)",
      "https://calibercorner.com/rolex-caliber-3135/",
      "https://patents.google.com/patent/US8529122 (a standard 20-tooth Swiss lever as the baseline)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (the 313x's 5:1 barrel to minute ratio)",
      "https://watchesbysjx.com/2024/08/geometric-efficiency-escapements.html",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://en.watch-spare.com/rolex-cal-3135-escape-wheel-410-rx-3135-410.html (lift 52°)",
      "https://gleave.london/seconds-wheel-fourth-wheel-rolex-3135-360-generic/",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3130, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3130, 52°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3135, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3135, 52°)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://giacatwatch.com/wp-content/uploads/2024/03/CALIBER-3135-3155-3175-3185-TECHNICAL-INFORMATION-1.pdf (Rolex technical information: 3135 at 28,800 bph and 52° lift)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Time only (hours, minutes, centre seconds), no date. Shares the going train, escapement, beat rate and lift setting of Rolex 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Existing 52° lift setting retained; the Rolex technical manual publishes 52° for 3135."
  },
  {
    "calibre": "Rolex 3155",
    "maker": "Rolex",
    "family": [
      "3155"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel, the 'seconds wheel' 3135-360)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://giacatwatch.com/wp-content/uploads/2024/03/CALIBER-3135-3155-3175-3185-TECHNICAL-INFORMATION-1.pdf (3155: day-date calendar with rapid corrector; derived from calibre 3135; 4 Hz, 52° lift; its second wheel has a longer pivot shank than the 3135's)",
      "https://calibercorner.com/rolex-caliber-3135/",
      "https://patents.google.com/patent/US8529122 (a standard 20-tooth Swiss lever as the baseline)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (the 313x's 5:1 barrel to minute ratio)",
      "https://watchesbysjx.com/2024/08/geometric-efficiency-escapements.html",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://en.watch-spare.com/rolex-cal-3135-escape-wheel-410-rx-3135-410.html (lift 52°)",
      "https://gleave.london/seconds-wheel-fourth-wheel-rolex-3135-360-generic/",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3135, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3135, 52°)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Day and date. Shares the going train, escapement, beat rate and lift setting of Rolex 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Existing 52° lift setting retained; the Rolex technical manual publishes 52° for 3135."
  },
  {
    "calibre": "Rolex 3175",
    "maker": "Rolex",
    "family": [
      "3175"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel, the 'seconds wheel' 3135-360)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://giacatwatch.com/wp-content/uploads/2024/03/CALIBER-3135-3155-3175-3185-TECHNICAL-INFORMATION-1.pdf (3175: date with rapid corrector and a 24-hour hand; derived from calibre 3135; 4 Hz, 52° lift)",
      "https://www.bqwatches.com/movements/rolex/calibre-3175 (fixed 24-hour hand; 28,800 vph; about 48 h)",
      "https://calibercorner.com/rolex-caliber-3135/",
      "https://patents.google.com/patent/US8529122 (a standard 20-tooth Swiss lever as the baseline)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (the 313x's 5:1 barrel to minute ratio)",
      "https://watchesbysjx.com/2024/08/geometric-efficiency-escapements.html",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://en.watch-spare.com/rolex-cal-3135-escape-wheel-410-rx-3135-410.html (lift 52°)",
      "https://gleave.london/seconds-wheel-fourth-wheel-rolex-3135-360-generic/",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3135, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3135, 52°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3175, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3175, 52°)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and a 24-hour hand set with the hour hand. Shares the going train, escapement, beat rate and lift setting of Rolex 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Existing 52° lift setting retained; the Rolex technical manual publishes 52° for 3135."
  },
  {
    "calibre": "Rolex 3185",
    "maker": "Rolex",
    "family": [
      "3185"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel, the 'seconds wheel' 3135-360)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://giacatwatch.com/wp-content/uploads/2024/03/CALIBER-3135-3155-3175-3185-TECHNICAL-INFORMATION-1.pdf (3185: semi-rapid date, time-zone setting by one-hour steps of the 12-hour hand; derived from calibre 3135; 4 Hz, 52° lift; its second wheel has a longer pivot shank than the 3135's)",
      "https://www.bqwatches.com/movements/rolex/calibre-3185 (independent GMT hand, date at 3; 28,800 vph; about 48 h)",
      "https://calibercorner.com/rolex-caliber-3135/",
      "https://patents.google.com/patent/US8529122 (a standard 20-tooth Swiss lever as the baseline)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (the 313x's 5:1 barrel to minute ratio)",
      "https://watchesbysjx.com/2024/08/geometric-efficiency-escapements.html",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://en.watch-spare.com/rolex-cal-3135-escape-wheel-410-rx-3135-410.html (lift 52°)",
      "https://gleave.london/seconds-wheel-fourth-wheel-rolex-3135-360-generic/",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3135, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3135, 52°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3185, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3185, 52°)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and a 24-hour hand, with the 12-hour hand set in one-hour steps. Shares the going train, escapement, beat rate and lift setting of Rolex 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Existing 52° lift setting retained; the Rolex technical manual publishes 52° for 3135."
  },
  {
    "calibre": "Rolex 3186",
    "maker": "Rolex",
    "family": [
      "3186"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel, the 'seconds wheel' 3135-360)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://www.bobswatches.com/rolex-blog/resources/rolex-caliber-3186-vs-rolex-caliber-3285.html (3186: instantaneous date, independently adjustable hand for a second time zone, 28,800 bph, 48 h, blue Parachrom hairspring; the last GMT movement on the 31xx platform)",
      "https://calibercorner.com/rolex-caliber-3135/",
      "https://patents.google.com/patent/US8529122 (a standard 20-tooth Swiss lever as the baseline)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (the 313x's 5:1 barrel to minute ratio)",
      "https://watchesbysjx.com/2024/08/geometric-efficiency-escapements.html",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://en.watch-spare.com/rolex-cal-3135-escape-wheel-410-rx-3135-410.html (lift 52°)",
      "https://gleave.london/seconds-wheel-fourth-wheel-rolex-3135-360-generic/",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3135, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3135, 52°)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://giacatwatch.com/wp-content/uploads/2024/03/CALIBER-3135-3155-3175-3185-TECHNICAL-INFORMATION-1.pdf (Rolex technical information: 3135 at 28,800 bph and 52° lift)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and a 24-hour hand, with an independently set hour hand. Shares the going train, escapement, beat rate and lift setting of Rolex 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Existing 52° lift setting retained; the Rolex technical manual publishes 52° for 3135."
  },
  {
    "calibre": "Rolex 3187",
    "maker": "Rolex",
    "family": [
      "3187"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel, the 'seconds wheel' 3135-360)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://www.bqwatches.com/movements/rolex/calibre-3187 (date at 3, separately set GMT hand; 28,800 vph)",
      "https://calibercorner.com/rolex-caliber-3135/",
      "https://patents.google.com/patent/US8529122 (a standard 20-tooth Swiss lever as the baseline)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (the 313x's 5:1 barrel to minute ratio)",
      "https://watchesbysjx.com/2024/08/geometric-efficiency-escapements.html",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://en.watch-spare.com/rolex-cal-3135-escape-wheel-410-rx-3135-410.html (lift 52°)",
      "https://gleave.london/seconds-wheel-fourth-wheel-rolex-3135-360-generic/",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Rolex 3135, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3135, 52°)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://giacatwatch.com/wp-content/uploads/2024/03/CALIBER-3135-3155-3175-3185-TECHNICAL-INFORMATION-1.pdf (Rolex technical information: 3135 at 28,800 bph and 52° lift)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and an independently set 24-hour hand. Shares the going train, escapement, beat rate and lift setting of Rolex 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Existing 52° lift setting retained; the Rolex technical manual publishes 52° for 3135."
  },
  {
    "calibre": "Dandong 3135",
    "maker": "Peacock (Dandong)",
    "family": [
      "Dandong 31xx",
      "DD31xx",
      "VS31xx",
      "DD3135",
      "VS3135"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: its sister movements now have their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date (the 3135's layout). Its sister movements on the same train have their own rows (#1822). Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Lift angle is unspecified: shared train counts do not establish the DD/VS escapement geometry."
  },
  {
    "calibre": "Dandong 3130",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD3130",
      "VS3130"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Time only, no date (the 3130's layout). Shares the going train, escapement, beat rate and lift setting of Dandong 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Lift angle is unspecified: shared train counts do not establish the DD/VS escapement geometry."
  },
  {
    "calibre": "Dandong 3186",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD3186",
      "VS3186"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and an independently set 24-hour hand (the 3186's layout). Shares the going train, escapement, beat rate and lift setting of Dandong 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Lift angle is unspecified: shared train counts do not establish the DD/VS escapement geometry."
  },
  {
    "calibre": "Dandong 3187",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD3187",
      "VS3187"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and an independently set 24-hour hand (the 3187's layout). Shares the going train, escapement, beat rate and lift setting of Dandong 3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. Lift angle is unspecified: shared train counts do not establish the DD/VS escapement geometry."
  },
  {
    "calibre": "VR3135",
    "maker": "Clone (maker not named)",
    "family": [
      "VR31xx"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (a true clone, part compatible with genuine parts; no shock setting on the escape wheel)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: its sister movements now have their own rows)",
      "https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350 (Peter Hudson's RWI post, quoted in the notes, 2026-11-16)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date (the 3135's layout). Its sister movements on the same train have their own rows (#1822). Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. VR is a trade prefix, not an identified movement manufacturer. Existing 52° lift setting retained from the cited forum guide; these photos do not independently verify it. Peter Hudson, on RWI (https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350), quoted on 2026-11-16: \"The JH6001-1 is almost certainly what we call the VR3135\". It identifies the movement only; no figure in this row comes from it."
  },
  {
    "calibre": "VR3130",
    "maker": "Clone (maker not named)",
    "family": [],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (a true clone, part compatible with genuine parts; no shock setting on the escape wheel)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)",
      "https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350 (Peter Hudson's RWI post, quoted in the notes, 2026-11-16)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Time only, no date (the 3130's layout). Shares the going train, escapement, beat rate and lift setting of VR3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. VR is a trade prefix, not an identified movement manufacturer. Existing 52° lift setting retained from the cited forum guide; these photos do not independently verify it. Peter Hudson, on RWI (https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350), quoted on 2026-11-16: \"The JH6000-1 is almost certainly what we call the VR3130\". It identifies the movement only; no figure in this row comes from it."
  },
  {
    "calibre": "VR3186",
    "maker": "Clone (maker not named)",
    "family": [],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (a true clone, part compatible with genuine parts; no shock setting on the escape wheel)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and an independently set 24-hour hand (the 3186's layout). Shares the going train, escapement, beat rate and lift setting of VR3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. VR is a trade prefix, not an identified movement manufacturer. Existing 52° lift setting retained from the cited forum guide; these photos do not independently verify it."
  },
  {
    "calibre": "VR3187",
    "maker": "Clone (maker not named)",
    "family": [],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 10
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 18
      },
      {
        "name": "third wheel",
        "period_s": 320,
        "teeth": 96,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx",
        "pinion": 12
      },
      {
        "name": "centre wheel",
        "period_s": 2160,
        "teeth": 81,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx; this slot is the second wheel (36 minutes), not the one-hour cannon pinion",
        "pinion": 12
      },
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "derived from photographed VR31xx tooth counts and 28,800 bph; contributor reports the same train for Rolex, DD/VS and VR31xx"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; separate from the 2160-second second wheel"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (a true clone, part compatible with genuine parts; no shock setting on the escape wheel)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://github.com/peterhudson/timegrapher/blob/main/docs/research/31xx-train-wheel-counts.md (Peter Hudson, VR31xx microscope photos and Rolex/DD/VS/VR applicability, 2026-10-19)",
      "https://github.com/peterhudson/timegrapher/issues/1822 (2026-11-15: a separate movement on the same going train, split from its sister row's aliases)",
      "https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350 (Peter Hudson's RWI post, quoted in the notes, 2026-11-16)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and an independently set 24-hour hand (the 3187's layout). Shares the going train, escapement, beat rate and lift setting of VR3135, from which it was split on 2026-11-15 (#1822); only the motion works differ. Train counts from the VR31xx photo set supplied by Peter Hudson on 2026-10-19: barrel 100, second 81/12, third 96/12, fourth 120/18, escape 20/10. He reports applicability to all genuine Rolex, DD/VS and VR31xx, including 3130, 3135, 3186 and 3187; this is contributor-reported coverage, not separate photographs of every variant. The centre-wheel slot represents the second wheel: 2160 s (36 minutes), distinct from the 3600 s cannon pinion. Third wheel 320 s; barrel 18000 s (5 h), independent of power reserve. SH31xx and all 32xx trains are excluded. Matching counts do not establish lift-angle equivalence or parts interchangeability. VR is a trade prefix, not an identified movement manufacturer. Existing 52° lift setting retained from the cited forum guide; these photos do not independently verify it. Peter Hudson, on RWI (https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350), quoted on 2026-11-16: \"The JH6002-1 is almost certainly what we call the VR3187\". It identifies the movement only; no figure in this row comes from it."
  },
  {
    "calibre": "SH3135",
    "maker": "Shanghai (clone)",
    "family": [],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 52,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "derived from the beat rate"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "basis": "derived from the beat rate"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (not fully compatible with genuine parts)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "A clone of the 3135 whose parts are not fully interchangeable with genuine ones, so the escape wheel is left out. That its parts are not fully interchangeable, and its 52° lift angle, rest only on one author's two forum guides (on clone movements and on lift angles); no independent source was found."
  },
  {
    "calibre": "Rolex 3230",
    "maker": "Rolex",
    "family": [
      "3230"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 55,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://bqwatches.com/movements/rolex/calibre-3230 (hours, minutes, seconds; 28,800 vph; Chronergy escapement; about 70 h)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (Chronergy keeps the tooth count; previous 98:16 barrel-ratio interpretation superseded by the photo contribution)",
      "https://patents.google.com/patent/US8529122",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://www.rolexforums.com/archive/index.php/t-701731.html (lift 55°, later 53°)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Time only (hours, minutes, seconds), no date. Shares the counted 32xx going train, escapement, beat rate and lift setting with Rolex 3235; only the motion works differ. Had been an alias of Rolex 3235 until 2026-11-15 (#1820). Chronergy escapement, about 70 h. Lift angle: 55° (perhaps 58°) is what this project and clone timegrapher guides use; watchmakers report Rolex's documents were revised to 53° for the 32xx, reportedly with no part change. The photographed 98-tooth barrel and 14-leaf second pinion give 25,200 s (7 h), superseding the provisional 98:16 reading (22,050 s). The 60 s amplitude dip on the project's reference 3235 is the fourth wheel. WatchGuy's list gives 53° for the 3235 and 3255; that figure is kept as its own entry, \"Rolex 3235 (53°)\". Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "Rolex 3235",
    "maker": "Rolex",
    "family": [
      "3235",
      "Rolex 32xx"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 55,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://calibercorner.com/rolex-caliber-3235/",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (Chronergy keeps the tooth count; previous 98:16 barrel-ratio interpretation superseded by the photo contribution)",
      "https://patents.google.com/patent/US8529122",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://www.rolexforums.com/archive/index.php/t-701731.html (lift 55°, later 53°)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3235, 55°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3255, 55°)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3255 and 3285 split into their own rows; this row keeps the family names)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date. The 3230, 3255 and 3285 have their own rows with the same going train (#1820). Chronergy escapement, about 70 h. Lift angle: 55° (perhaps 58°) is what this project and clone timegrapher guides use; watchmakers report Rolex's documents were revised to 53° for the 32xx, reportedly with no part change. The photographed 98-tooth barrel and 14-leaf second pinion give 25,200 s (7 h), superseding the provisional 98:16 reading (22,050 s). The 60 s amplitude dip on the project's reference 3235 is the fourth wheel. WatchGuy's list gives 53° for the 3235 and 3255; that figure is kept as its own entry, \"Rolex 3235 (53°)\". Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "Rolex 3255",
    "maker": "Rolex",
    "family": [
      "3255"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 55,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://www.bqwatches.com/movements/rolex/Calibre-3255 (day at 12, date at 3; 28,800 vph; Chronergy escapement; about 70 h)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (Chronergy keeps the tooth count; previous 98:16 barrel-ratio interpretation superseded by the photo contribution)",
      "https://patents.google.com/patent/US8529122",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://www.rolexforums.com/archive/index.php/t-701731.html (lift 55°, later 53°)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Rolex 3255, 55°)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Day and date. Shares the counted 32xx going train, escapement, beat rate and lift setting with Rolex 3235; only the motion works differ. Had been an alias of Rolex 3235 until 2026-11-15 (#1820). Chronergy escapement, about 70 h. Lift angle: 55° (perhaps 58°) is what this project and clone timegrapher guides use; watchmakers report Rolex's documents were revised to 53° for the 32xx, reportedly with no part change. The photographed 98-tooth barrel and 14-leaf second pinion give 25,200 s (7 h), superseding the provisional 98:16 reading (22,050 s). The 60 s amplitude dip on the project's reference 3235 is the fourth wheel. WatchGuy's list gives 53° for the 3235 and 3255; that figure is kept as its own entry, \"Rolex 3235 (53°)\". Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "Rolex 3285",
    "maker": "Rolex",
    "family": [
      "3285"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 55,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://www.bqwatches.com/movements/rolex/calibre-3285 (24-hour hand and date; 28,800 vph; Chronergy escapement; about 70 h)",
      "https://watchesbysjx.com/2021/05/rolex-chronergy-analysis.html (Chronergy keeps the tooth count; previous 98:16 barrel-ratio interpretation superseded by the photo contribution)",
      "https://patents.google.com/patent/US8529122",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://www.rolexforums.com/archive/index.php/t-701731.html (lift 55°, later 53°)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and an independently set 24-hour (GMT) hand. Shares the counted 32xx going train, escapement, beat rate and lift setting with Rolex 3235; only the motion works differ. Had been an alias of Rolex 3235 until 2026-11-15 (#1820). Chronergy escapement, about 70 h. Lift angle: 55° (perhaps 58°) is what this project and clone timegrapher guides use; watchmakers report Rolex's documents were revised to 53° for the 32xx, reportedly with no part change. The photographed 98-tooth barrel and 14-leaf second pinion give 25,200 s (7 h), superseding the provisional 98:16 reading (22,050 s). The 60 s amplitude dip on the project's reference 3235 is the fourth wheel. WatchGuy's list gives 53° for the 3235 and 3255; that figure is kept as its own entry, \"Rolex 3235 (53°)\". Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "Dandong 3230",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD3230"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 59,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/dd32xx-optical-amplitude-validation.md (2026-11-03: one DD3285 specimen, four blind optical/acoustic takes; empirical 59° family setting selected for DD32xx and JH32xx, not an exact physical lift-angle determination)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (genuine parts swap in; 70+ h; the replicas' escape wheels are solid; the DD3285 is a true clone)",
      "https://forum.replica-watch.info/threads/jh3235-free-sprung-movement-tear-down.11040479/ (larger pallet stones than the genuine fork; no Chronergy escape wheel)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Time only (hours, minutes, seconds), no date. Shares the counted 32xx going train, escapement, beat rate and lift setting with Dandong 3235; only the motion works differ. Had been an alias of Dandong 3235 until 2026-11-15 (#1820). About 70 h power reserve. The 59° lift setting is an empirical catalogue choice from four blind optical/acoustic takes of one DD3285 specimen (2026-11-03); effective matching settings span about 58–59°, not a definitive physical lift-angle measurement. Applied to the DD32xx family by maintainer decision; individual variants were not separately measured. The earlier bench recording dd3235_DU_30min used a genuine balance complete, pallet fork and escape wheel and showed a 5.00 s rate cycle. The photographed escape wheel now provides a direct 20-tooth count. The ambiguous alias \"3235 (clone)\" has been removed: select an explicit DD, JH, VR or SH designation. Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "Dandong 3235",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD3235",
      "VS3235",
      "DD32xx",
      "Dandong 32xx"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 59,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/dd32xx-optical-amplitude-validation.md (2026-11-03: one DD3285 specimen, four blind optical/acoustic takes; empirical 59° family setting selected for DD32xx and JH32xx, not an exact physical lift-angle determination)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (genuine parts swap in; 70+ h; the replicas' escape wheels are solid; the DD3285 is a true clone)",
      "https://forum.replica-watch.info/threads/jh3235-free-sprung-movement-tear-down.11040479/ (larger pallet stones than the genuine fork; no Chronergy escape wheel)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3255 and 3285 split into their own rows; this row keeps the family names)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date. The 3230, 3255 and 3285 have their own rows with the same going train (#1820). About 70 h power reserve. The 59° lift setting is an empirical catalogue choice from four blind optical/acoustic takes of one DD3285 specimen (2026-11-03); effective matching settings span about 58–59°, not a definitive physical lift-angle measurement. Applied to the DD32xx family by maintainer decision; individual variants were not separately measured. The earlier bench recording dd3235_DU_30min used a genuine balance complete, pallet fork and escape wheel and showed a 5.00 s rate cycle. The photographed escape wheel now provides a direct 20-tooth count. The ambiguous alias \"3235 (clone)\" has been removed: select an explicit DD, JH, VR or SH designation. Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "Dandong 3255",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD3255"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 59,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/dd32xx-optical-amplitude-validation.md (2026-11-03: one DD3285 specimen, four blind optical/acoustic takes; empirical 59° family setting selected for DD32xx and JH32xx, not an exact physical lift-angle determination)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (genuine parts swap in; 70+ h; the replicas' escape wheels are solid; the DD3285 is a true clone)",
      "https://forum.replica-watch.info/threads/jh3235-free-sprung-movement-tear-down.11040479/ (larger pallet stones than the genuine fork; no Chronergy escape wheel)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Day and date. Shares the counted 32xx going train, escapement, beat rate and lift setting with Dandong 3235; only the motion works differ. Had been an alias of Dandong 3235 until 2026-11-15 (#1820). About 70 h power reserve. The 59° lift setting is an empirical catalogue choice from four blind optical/acoustic takes of one DD3285 specimen (2026-11-03); effective matching settings span about 58–59°, not a definitive physical lift-angle measurement. Applied to the DD32xx family by maintainer decision; individual variants were not separately measured. The earlier bench recording dd3235_DU_30min used a genuine balance complete, pallet fork and escape wheel and showed a 5.00 s rate cycle. The photographed escape wheel now provides a direct 20-tooth count. The ambiguous alias \"3235 (clone)\" has been removed: select an explicit DD, JH, VR or SH designation. Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "Dandong 3285",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD3285"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 59,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/dd32xx-optical-amplitude-validation.md (2026-11-03: one DD3285 specimen, four blind optical/acoustic takes; empirical 59° family setting selected for DD32xx and JH32xx, not an exact physical lift-angle determination)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (genuine parts swap in; 70+ h; the replicas' escape wheels are solid; the DD3285 is a true clone)",
      "https://forum.replica-watch.info/threads/jh3235-free-sprung-movement-tear-down.11040479/ (larger pallet stones than the genuine fork; no Chronergy escape wheel)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and an independently set 24-hour (GMT) hand. Shares the counted 32xx going train, escapement, beat rate and lift setting with Dandong 3235; only the motion works differ. Had been an alias of Dandong 3235 until 2026-11-15 (#1820). About 70 h power reserve. The 59° lift setting is an empirical catalogue choice from four blind optical/acoustic takes of one DD3285 specimen (2026-11-03); effective matching settings span about 58–59°, not a definitive physical lift-angle measurement. Applied to the DD32xx family by maintainer decision; individual variants were not separately measured. The earlier bench recording dd3235_DU_30min used a genuine balance complete, pallet fork and escape wheel and showed a 5.00 s rate cycle. The photographed escape wheel now provides a direct 20-tooth count. The ambiguous alias \"3235 (clone)\" has been removed: select an explicit DD, JH, VR or SH designation. Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "JH3230",
    "maker": "Shanghai Jinghe (clone)",
    "family": [
      "Jinghe 3230"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 59,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/dd32xx-optical-amplitude-validation.md (2026-11-03: one DD3285 specimen, four blind optical/acoustic takes; empirical 59° family setting selected for DD32xx and JH32xx, not an exact physical lift-angle determination)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (free sprung, flat hairspring, pallet jewel appears to be in the genuine skewed position)",
      "https://forum.replica-watch.info/threads/jh3235-free-sprung-movement-tear-down.11040479/ (a true clone, generally part interchangeable with genuine parts; a genuine balance ran in it after an end-shake adjustment)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Time only (hours, minutes, seconds), no date. Shares the counted 32xx going train, escapement, beat rate and lift setting with JH3235; only the motion works differ. Had been an alias of JH3235 until 2026-11-15 (#1820). A 32xx clone with a free-sprung balance and flat hairspring. The 59° lift setting is applied to the JH32xx family by maintainer decision from the DD3285 optical/acoustic study (2026-11-03). No JH specimen was measured; this is a family-level empirical default, not a measured JH physical lift angle. It has a shock setting for the escape wheel. Power reserve not documented. Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "JH3235",
    "maker": "Shanghai Jinghe (clone)",
    "family": [
      "Jinghe 3235",
      "JH32xx",
      "Jinghe 32xx"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 59,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/dd32xx-optical-amplitude-validation.md (2026-11-03: one DD3285 specimen, four blind optical/acoustic takes; empirical 59° family setting selected for DD32xx and JH32xx, not an exact physical lift-angle determination)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (free sprung, flat hairspring, pallet jewel appears to be in the genuine skewed position)",
      "https://forum.replica-watch.info/threads/jh3235-free-sprung-movement-tear-down.11040479/ (a true clone, generally part interchangeable with genuine parts; a genuine balance ran in it after an end-shake adjustment)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3255 and 3285 split into their own rows; this row keeps the family names)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date. The 3230, 3255 and 3285 have their own rows with the same going train (#1820). A 32xx clone with a free-sprung balance and flat hairspring. The 59° lift setting is applied to the JH32xx family by maintainer decision from the DD3285 optical/acoustic study (2026-11-03). No JH specimen was measured; this is a family-level empirical default, not a measured JH physical lift angle. It has a shock setting for the escape wheel. Power reserve not documented. Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "JH3255",
    "maker": "Shanghai Jinghe (clone)",
    "family": [
      "Jinghe 3255"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 59,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/dd32xx-optical-amplitude-validation.md (2026-11-03: one DD3285 specimen, four blind optical/acoustic takes; empirical 59° family setting selected for DD32xx and JH32xx, not an exact physical lift-angle determination)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (free sprung, flat hairspring, pallet jewel appears to be in the genuine skewed position)",
      "https://forum.replica-watch.info/threads/jh3235-free-sprung-movement-tear-down.11040479/ (a true clone, generally part interchangeable with genuine parts; a genuine balance ran in it after an end-shake adjustment)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Day and date. Shares the counted 32xx going train, escapement, beat rate and lift setting with JH3235; only the motion works differ. Had been an alias of JH3235 until 2026-11-15 (#1820). A 32xx clone with a free-sprung balance and flat hairspring. The 59° lift setting is applied to the JH32xx family by maintainer decision from the DD3285 optical/acoustic study (2026-11-03). No JH specimen was measured; this is a family-level empirical default, not a measured JH physical lift angle. It has a shock setting for the escape wheel. Power reserve not documented. Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "JH3285",
    "maker": "Shanghai Jinghe (clone)",
    "family": [
      "Jinghe 3285"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 59,
    "seconds": "centre (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 11,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "pinion": 12,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 14,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 98,
        "basis": "derived from photographed tooth counts; family applicability confirmed by Peter Hudson, 2026-10-19; see docs/research/32xx-train-wheel-counts.md"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/dd32xx-optical-amplitude-validation.md (2026-11-03: one DD3285 specimen, four blind optical/acoustic takes; empirical 59° family setting selected for DD32xx and JH32xx, not an exact physical lift-angle determination)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (free sprung, flat hairspring, pallet jewel appears to be in the genuine skewed position)",
      "https://forum.replica-watch.info/threads/jh3235-free-sprung-movement-tear-down.11040479/ (a true clone, generally part interchangeable with genuine parts; a genuine balance ran in it after an end-shake adjustment)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "docs/research/32xx-train-wheel-counts.md (Peter Hudson, 2026-10-19: microscope tooth counts and confirmation that the train applies to all genuine Rolex, Dandong and Jinghe 32xx; excludes VR32xx and SH32xx)",
      "https://github.com/peterhudson/timegrapher/issues/1820 (2026-11-15: 3230, 3235, 3255 and 3285 are separate movements with the same escapement and going train and different motion works; split into their own rows)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Date and an independently set 24-hour (GMT) hand. Shares the counted 32xx going train, escapement, beat rate and lift setting with JH3235; only the motion works differ. Had been an alias of JH3235 until 2026-11-15 (#1820). A 32xx clone with a free-sprung balance and flat hairspring. The 59° lift setting is applied to the JH32xx family by maintainer decision from the DD3285 optical/acoustic study (2026-11-03). No JH specimen was measured; this is a family-level empirical default, not a measured JH physical lift angle. It has a shock setting for the escape wheel. Power reserve not documented. Train counts and periods apply to all genuine Rolex, Dandong and Jinghe 32xx (3230, 3235, 3255, 3285), as confirmed by Peter Hudson with his 2026-10-19 photo contribution. They do not apply to VR32xx or SH32xx. The centre wheel here is the photographed second wheel that drives the cannon pinion."
  },
  {
    "calibre": "VR3235",
    "maker": "Shanghai (clone)",
    "family": [
      "VR32xx"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 52,
    "seconds": "centre",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 18000,
        "teeth": 100,
        "basis": "Counted in Peter Hudson VR32xx photographs; period derived from ratios and confirmed one-hour second / one-minute fourth wheel. See docs/research/vr32xx-train-wheel-counts.md."
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "basis": "Counted in Peter Hudson VR32xx photographs; period derived from ratios and confirmed one-hour second / one-minute fourth wheel. See docs/research/vr32xx-train-wheel-counts.md.",
        "pinion": 20
      },
      {
        "name": "third wheel",
        "period_s": 540,
        "teeth": 99,
        "basis": "Counted in Peter Hudson VR32xx photographs; period derived from ratios and confirmed one-hour second / one-minute fourth wheel. See docs/research/vr32xx-train-wheel-counts.md.",
        "pinion": 12
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "basis": "Counted in Peter Hudson VR32xx photographs; period derived from ratios and confirmed one-hour second / one-minute fourth wheel. See docs/research/vr32xx-train-wheel-counts.md.",
        "pinion": 11
      },
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "basis": "Accepted 20/10 escape pair: matches the photographed 31xx and genuine/DD/Jinghe 32xx pairs and satisfies 28800 bph with 120-tooth fourth wheel at 60 s. Contributor accepted this as the standard VR32xx configuration; no VR escape-wheel photograph supplied. See docs/research/vr32xx-train-wheel-counts.md.",
        "pinion": 10
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from 28800 bph"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (a hybrid of the 3135 and 3235, about 40 h)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "docs/research/vr32xx-train-wheel-counts.md (Peter Hudson microscope photographs, corrected filenames and accepted escape-pair specification, 2026-10-19)",
      "https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350 (Peter Hudson's RWI post, quoted in the notes, 2026-11-16)"
    ],
    "confidence": "derived from tooth counts; accepted escape pair",
    "notes": "VR32xx family contribution: barrel 100; second 80/20; third 99/12; fourth 120/11. The third and fourth photograph labels were swapped, confirmed by Peter Hudson. Barrel 18000 s (5 h), second 3600 s, third 540 s, fourth 60 s. Escape 20/10 and 5 s are accepted as the standard VR32xx specification by the contributor, based on agreement with both measured Rolex-derived families; the VR escape wheel was not photographed. These counts do not apply to SH32xx or replace genuine/DD/Jinghe 32xx counts. Coverage of VR3235/VR3285 is a family transfer from one photographed set; no assertion of parts interchangeability. Existing lift settings are retained, not inferred from train teeth. Peter Hudson, on RWI (https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350), quoted on 2026-11-16: \"The JH6501 is almost certainly what we call the VR3235\". It identifies the movement only; no figure in this row comes from it.",
    "escape_teeth": 20
  },
  {
    "calibre": "SH3285",
    "maker": "Shanghai (clone)",
    "family": [
      "SH3285-2"
    ],
    "common": true,
    "bph": 28800,
    "seconds": "centre",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "derived from the beat rate"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "basis": "derived from the beat rate"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (closer to genuine than the VR3235; balance, pallet fork and escape wheel not to genuine spec)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "Everything in this entry rests on one source, one author's forum guide to clone movements, and no second source was found: its account of the escapement (not to genuine spec, so the escape wheel and lift angle are left out) and the beat rate, taken as the 28,800 bph of the Rolex 32xx it copies. The balance follows from that beat rate, and the fourth and centre wheels from the centre-seconds layout of the 32xx. VR3285 is now a separate entry with contributor-reported VR32xx train applicability. SH retains the unmeasured train."
  },
  {
    "calibre": "Rolex 4130",
    "maker": "Rolex",
    "family": [
      "4130"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "small seconds at 6 (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived: 20 photographed escape teeth at 28800 bph give 5 s; 10 pinion leaves counted in the least-sharp detail image, also consistent with 120:10 fourth-to-escape ratio"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 12,
        "basis": "derived: 5 s escape wheel and photographed 120:10 mesh give 60 s. Receiving pinion 12 is INFERRED from the supplied 96/12 third wheel and one-hour second wheel; it is hidden, not directly counted. The separate 30-tooth steel gear on this arbor drives the clutch"
      },
      {
        "name": "third wheel",
        "period_s": 480,
        "teeth": 96,
        "pinion": 12,
        "basis": "derived: photographed second wheel 90 drives this 12-leaf pinion; 3600 x 12 / 90 = 480 s. Identity is consistent with a 12-leaf fourth receiving pinion, not independently proved by the inferred ratio"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 90,
        "pinion": 15,
        "basis": "contributor constraint: photographed second (minute-driving) wheel turns once per hour. Centre wheel is the catalogue slot name, not a claim that this arbor occupies the movement centre"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; retained separately from the photographed second wheel"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 105,
        "basis": "derived: photographed 105-tooth barrel drives 15-leaf second pinion; 3600 x 105 / 15 = 25200 s (7 h). This is the drum rotation period, not power reserve"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/4130-train-wheel-counts.md (Peter Hudson, 2026-10-19: DD4130 microscope photographs; contributor reports matching counts and periods for genuine Rolex 4130 and SH4130; fourth receiving pinion inferred)",
      "https://forum.uurwerkherstellers.nl/downloads/rolex4130.pdf (Rolex Technical Information No. 61, May 2000, printed pp. 5-7: 28800 bph, 20 escape teeth, 7 h barrel, 52 degree lift angle and clutch layout)",
      "https://calibercorner.com/rolex-caliber-4130/",
      "https://www.watch-wiki.net/doku.php?id=rolex_4130",
      "https://patents.google.com/patent/US8529122",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "72 h nominal power reserve. Rolex Technical Information No. 61 (May 2000), printed p. 5, publishes 52 degree lift, 28800 bph, 20 escape teeth and one barrel turn per 7 h. Photographed DD4130 counts and derived periods are applied to Rolex 4130 and SH4130 on Peter Hudson's stated applicability; only the DD4130 set was photographed. The fourth receiving pinion is inferred as 12 leaves, while its separate clutch-drive gear is directly counted at 30 teeth. The 96/12 third wheel fits the train but its identity is not independently established by inferring that hidden pinion. Clutch input 30, output 70 and chronograph seconds counter 70 are documented separately; the output and counter rotate once per minute only when engaged. No propagation to 4131, 4030 or 7750-based Daytona homages."
  },
  {
    "calibre": "Dandong 4130",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD4130"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "small seconds at 6 (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived: 20 photographed escape teeth at 28800 bph give 5 s; 10 pinion leaves counted in the least-sharp detail image, also consistent with 120:10 fourth-to-escape ratio"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 12,
        "basis": "derived: 5 s escape wheel and photographed 120:10 mesh give 60 s. Receiving pinion 12 is INFERRED from the supplied 96/12 third wheel and one-hour second wheel; it is hidden, not directly counted. The separate 30-tooth steel gear on this arbor drives the clutch"
      },
      {
        "name": "third wheel",
        "period_s": 480,
        "teeth": 96,
        "pinion": 12,
        "basis": "derived: photographed second wheel 90 drives this 12-leaf pinion; 3600 x 12 / 90 = 480 s. Identity is consistent with a 12-leaf fourth receiving pinion, not independently proved by the inferred ratio"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 90,
        "pinion": 15,
        "basis": "contributor constraint: photographed second (minute-driving) wheel turns once per hour. Centre wheel is the catalogue slot name, not a claim that this arbor occupies the movement centre"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; retained separately from the photographed second wheel"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 105,
        "basis": "derived: photographed 105-tooth barrel drives 15-leaf second pinion; 3600 x 105 / 15 = 25200 s (7 h). This is the drum rotation period, not power reserve"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/4130-train-wheel-counts.md (Peter Hudson, 2026-10-19: DD4130 microscope photographs; contributor reports matching counts and periods for genuine Rolex 4130 and SH4130; fourth receiving pinion inferred)",
      "https://forum.uurwerkherstellers.nl/downloads/rolex4130.pdf (Rolex Technical Information No. 61, May 2000, printed pp. 5-7: 28800 bph, 20 escape teeth, 7 h barrel, 52 degree lift angle and clutch layout)",
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (a true clone, compatible with genuine parts)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "52 degree lift angle: published for genuine Rolex 4130 in its technical manual and separately confirmed by Peter Hudson for all 4130 variants (2026-10-19). The photo contribution establishes gear counts, not lift geometry. Earlier bench recordings independently showed a 5 s rate cycle. The ambiguous 4130 (clone) alias is removed: select DD4130 or SH4130 explicitly. Photographed DD4130 counts and derived periods are applied to Rolex 4130 and SH4130 on Peter Hudson's stated applicability; only the DD4130 set was photographed. The fourth receiving pinion is inferred as 12 leaves, while its separate clutch-drive gear is directly counted at 30 teeth. The 96/12 third wheel fits the train but its identity is not independently established by inferring that hidden pinion. Clutch input 30, output 70 and chronograph seconds counter 70 are documented separately; the output and counter rotate once per minute only when engaged. No propagation to 4131, 4030 or 7750-based Daytona homages."
  },
  {
    "calibre": "SH4130",
    "maker": "Shanghai (clone)",
    "family": [
      "Shanghai 4130"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "seconds": "small seconds at 6 (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "pinion": 10,
        "basis": "derived: 20 photographed escape teeth at 28800 bph give 5 s; 10 pinion leaves counted in the least-sharp detail image, also consistent with 120:10 fourth-to-escape ratio"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 120,
        "pinion": 12,
        "basis": "derived: 5 s escape wheel and photographed 120:10 mesh give 60 s. Receiving pinion 12 is INFERRED from the supplied 96/12 third wheel and one-hour second wheel; it is hidden, not directly counted. The separate 30-tooth steel gear on this arbor drives the clutch"
      },
      {
        "name": "third wheel",
        "period_s": 480,
        "teeth": 96,
        "pinion": 12,
        "basis": "derived: photographed second wheel 90 drives this 12-leaf pinion; 3600 x 12 / 90 = 480 s. Identity is consistent with a 12-leaf fourth receiving pinion, not independently proved by the inferred ratio"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 90,
        "pinion": 15,
        "basis": "contributor constraint: photographed second (minute-driving) wheel turns once per hour. Centre wheel is the catalogue slot name, not a claim that this arbor occupies the movement centre"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand; retained separately from the photographed second wheel"
      },
      {
        "name": "barrel",
        "period_s": 25200,
        "teeth": 105,
        "basis": "derived: photographed 105-tooth barrel drives 15-leaf second pinion; 3600 x 105 / 15 = 25200 s (7 h). This is the drum rotation period, not power reserve"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "docs/research/4130-train-wheel-counts.md (Peter Hudson, 2026-10-19: DD4130 microscope photographs; contributor reports matching counts and periods for genuine Rolex 4130 and SH4130; fourth receiving pinion inferred)",
      "https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350 (Peter Hudson's RWI post, quoted in the notes, 2026-11-16)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Added from Peter Hudson's report that SH4130 shares these counts and periods. Peter Hudson separately confirms that all 4130 variants share the genuine Rolex 4130 lift angle of 52 degrees (2026-10-19); the Rolex manual publishes that value for genuine 4130. No SH4130 component photographs or lift-angle measurement were supplied. Matching gear ratios do not establish genuine-part interchangeability. Photographed DD4130 counts and derived periods are applied to Rolex 4130 and SH4130 on Peter Hudson's stated applicability; only the DD4130 set was photographed. The fourth receiving pinion is inferred as 12 leaves, while its separate clutch-drive gear is directly counted at 30 teeth. The 96/12 third wheel fits the train but its identity is not independently established by inferring that hidden pinion. Clutch input 30, output 70 and chronograph seconds counter 70 are documented separately; the output and counter rotate once per minute only when engaged. No propagation to 4131, 4030 or 7750-based Daytona homages. Peter Hudson, on RWI (https://forum.replica-watch.info/threads/new-3235-free-sprung-from-sh-jh.11032029/#post-12474350), quoted on 2026-11-16: \"The JH6203 is almost certainly one of the \"Shanghai\" 4130 movements\". It identifies the movement only; no figure in this row comes from it.",
    "lift_angle_deg": 52
  },
  {
    "calibre": "Rolex 4131",
    "maker": "Rolex",
    "family": [
      "4131"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 55,
    "seconds": "small seconds at 6 (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "inferred: Rolex's escapement patent uses a standard 20-tooth Swiss lever as its baseline (its own design has 24 teeth); not confirmed for this calibre; SJX says Chronergy keeps the old count"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "derived: carries the small seconds"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://www.professionalwatches.com/rolex-caliber-4131/",
      "https://calibercorner.com/rolex-caliber-4132",
      "https://patents.google.com/patent/US8529122",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "2023 successor of the 4130 with the Chronergy escapement, 72 h. Lift 55° is the clone timegrapher guide's figure, from the pallet fork's geometry, not measured; Caliber Corner lists the 4132's as unconfirmed. Whether the 4130's 7 h barrel carries over was not found, so the barrel is left out."
  },
  {
    "calibre": "Dandong 4131",
    "maker": "Peacock (Dandong)",
    "family": [
      "DD4131",
      "VS4131",
      "4131 (clone)"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 55,
    "seconds": "small seconds at 6 (fourth wheel)",
    "wheels": [
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "inferred: a gen-like skeletonised escape wheel; the factory says 95% of the parts interchange with the 4131's"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "derived: carries the small seconds"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (gen-like Chronergy pallet fork and skeletonised escape wheel)",
      "https://forum.replica-watch.info/threads/a-comprehensive-info-on-the-vs4131-aka-dd4131.10997243/ (the factory's own write-up: 95% of parts interchange with the genuine)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "Its train is taken as the 4131's on the factory's claim that 95% of parts interchange. Whether a genuine balance complete fits is unconfirmed. Lift 55° as the 4131, probably, not measured. Its 55° lift angle rests only on one author's two forum guides (on clone movements and on lift angles). That 95% of parts interchange rests only on the factory's own write-up; the guides do not claim it."
  },
  {
    "calibre": "SH4131",
    "maker": "Shanghai (clone)",
    "family": [],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 52,
    "seconds": "small seconds at 6 (fourth wheel)",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "derived: carries the small seconds"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/comprehensive-guide-to-clone-movements-found-in-rolex-reps.10936248/ (a true clone except the escapement; not compatible with a genuine 4131 balance)",
      "https://forum.replica-watch.info/threads/a-comprehensive-info-on-the-vs4131-aka-dd4131.10997243/ (a T-shaped pallet fork as in Asian 7750s; no skeletonised escape wheel and no shock setting for it)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "A clone of the 4131 except for the escapement, which has a T-shaped pallet fork as in Asian 7750s, not the Chronergy one. Lift 52°, as the Rolex 31xx, whose pallet fork geometry it resembles, is a bench setting, not a published figure. The escape wheel is not the genuine one and is left out. The T-shaped pallet fork rests only on the Dandong (VS) factory's write-up on its own DD4131. That it is a clone of the 4131 except for the escapement rests only on one author's forum guide to clone movements."
  },
  {
    "calibre": "Audemars Piguet 3120",
    "maker": "Audemars Piguet",
    "family": [
      "AP 3120",
      "3120"
    ],
    "common": true,
    "bph": 21600,
    "lift_angle_deg": 53,
    "seconds": "centre",
    "wheels": [
      {
        "name": "seconds wheel",
        "period_s": 60,
        "basis": "derived: the seconds hand turns once a minute"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://calibercorner.com/audemars-piguet-caliber-ap-3120/",
      "https://watchbase.com/audemars-piguet/caliber/ap-3120",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "https://forum.replica-watch.info/threads/the-ap-questions-thread-all-the-questions-you-want-to-ask-about-ap-but-were-afraid-to.10880676/page-4 (older replicas on a Miyota 9015 at 28,800 vph)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "60 h, hacking. AP publishes no lift angle; 53° is the clone timegrapher guide's. Whether the seconds are driven directly was not found. Clones sold as '3120': see SA3120; older AP replicas built on a Miyota 9015 run at 28,800 bph and match that entry."
  },
  {
    "calibre": "Audemars Piguet 4302",
    "maker": "Audemars Piguet",
    "family": [
      "AP 4302",
      "4302"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 52,
    "seconds": "centre",
    "wheels": [
      {
        "name": "seconds wheel",
        "period_s": 60,
        "basis": "derived: the seconds hand turns once a minute"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://calibercorner.com/audemars-piguet-caliber-4302",
      "https://www.thenakedwatchmaker.com/decon-audemars-piguet",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "70 h. Lift 52° is the clone timegrapher guide's; Caliber Corner lists it as unconfirmed. The 4309 is a no-date version; its train is probably the same but this is not confirmed. Escape wheel tooth count not found."
  },
  {
    "calibre": "Audemars Piguet 4401",
    "maker": "Audemars Piguet",
    "family": [
      "AP 4401",
      "4401"
    ],
    "common": true,
    "bph": 28800,
    "seconds": "small seconds at 6; centre chronograph seconds",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "inferred: carries the small seconds"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://reference.grail-watch.com/movement/ap-4401/",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "Flyback chronograph, 70 h. Lift angle probably 50 to 52° per the clone timegrapher guide, not settled, so none is given."
  },
  {
    "calibre": "Audemars Piguet 2121",
    "maker": "Audemars Piguet",
    "family": [
      "AP 2121",
      "2121",
      "AP 2120",
      "2120",
      "JLC 920",
      "Jaeger-LeCoultre 920"
    ],
    "common": true,
    "bph": 19800,
    "seconds": "none (hours and minutes only)",
    "wheels": [
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.363636,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://apchronicles.audemarspiguet.com/en/calibre/calibre-2120",
      "https://calibercorner.com/jaeger-lecoultre-caliber-920/",
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 2120, 56°, 19800 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 2120, 56°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 2120, 56°, 19800 vph)",
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 2121, 56°, 19800 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 2121, 56°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 2121, 56°, 19800 vph)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "Ultra-thin, built on the Jaeger-LeCoultre 920, 19,800 bph, 40 h; the 2121 adds a date to the 2120. AP lists hours and minutes only, while Caliber Corner's 920 page shows a seconds hand; no seconds wheel is named. Lift angle 56° from WatchGuy, Watchmaking Tools, the lift-angle sheet.",
    "lift_angle_deg": 56.0
  },
  {
    "calibre": "SA3120",
    "maker": "Shanghai Jinghe (clone)",
    "family": [
      "3120 (clone)",
      "APS 3120",
      "ZF 3120",
      "AP3120 Clone",
      "Audemars Piguet 3120 Clone",
      "Jinghe 3120",
      "Jinghe SA3120"
    ],
    "common": true,
    "bph": 21600,
    "lift_angle_deg": 53,
    "seconds": "centre",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 28800,
        "teeth": 104,
        "basis": "photographed AP3120 clone tooth counts, Peter Hudson, 2026-10-21; 3600 × 104/13 = 28800 s; the simple intermediate wheel cancels from the ratio; running drum, not power reserve"
      },
      {
        "name": "intermediate wheel",
        "period_s": 11076.923076923076,
        "teeth": 40,
        "basis": "photographed AP3120 clone tooth counts, Peter Hudson, 2026-10-21; flat wheel with two pivots and NO pinion, physically confirmed by contributor; rim meshes directly with barrel and both 13-leaf receivers; 3600 × 40/13 s"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 80,
        "pinion": 13,
        "basis": "photographed AP3120 clone tooth counts, Peter Hudson, 2026-10-21; offset centre (second) wheel, supplied as Third Wheel.JPG; 450 × 80/10 = 3600 s"
      },
      {
        "name": "third wheel",
        "period_s": 450,
        "teeth": 75,
        "pinion": 10,
        "basis": "photographed AP3120 clone tooth counts, Peter Hudson, 2026-10-21; supplied as Fourth Wheel.JPG; 60 × 75/10 = 450 s"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 81,
        "pinion": 10,
        "basis": "photographed AP3120 clone tooth counts, Peter Hudson, 2026-10-21; supplied as Fifth Wheel.JPG; carries centre seconds, contributor confirms 60 s; (20/3) × 81/9 = 60 s"
      },
      {
        "name": "escape wheel",
        "period_s": 6.666666666666667,
        "teeth": 20,
        "pinion": 9,
        "basis": "photographed AP3120 clone tooth counts, Peter Hudson, 2026-10-21; 20 × 7200/21600 = 20/3 s; independently 60 × 9/81 s"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "pinion": 13,
        "basis": "photographed AP3120 clone tooth counts, Peter Hudson, 2026-10-21; 13 leaves counted on the minutes-drive pinion carrying the cannon pinion; driven by intermediate rim: (144000/13) × 13/40 = 3600 s, matching contributor confirmation; no separate motion-works tooth count asserted"
      },
      {
        "name": "balance",
        "period_s": 0.3333333333333333,
        "basis": "derived from contributor-confirmed 21600 beats/hour; full oscillation"
      }
    ],
    "sources": [
      "Peter Hudson, 2026-10-21: identifies Jinghe as the manufacturer of SA3120; APS and ZF retained as marketed movement aliases",
      "docs/research/ap3120-clone-train-wheel-counts.md — Peter Hudson, six AP3120 clone microscope photographs, 21600 bph, hand periods and physically checked pinionless intermediate wheel, 2026-10-21",
      "https://forum.replica-watch.info/threads/aps-15400-super-clone-3120mvt.10248933/page-10 ('This movement is 21600bph')",
      "https://forum.replica-watch.info/threads/zf-new-release-15400-with-cal-3120.10367719/page-2 ('21600 vph')",
      "https://clonology.is/product/audemars-piguet-royal-oak-ref15710st-oo-a027ca-01-off-shore-diver-swiss-3120-clone-movement-replica/ (21,600)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Photographed AP3120 clone train: barrel 104, simple intermediate 40 with no pinion, offset centre 80/13, third 75/10, fourth 81/10, escape 20/9, minutes-drive pinion 13. Contributor physically confirms the intermediate rim meshes directly with the barrel; its two pivots carry no pinion. It drives both the centre and minutes pinions. The one-hour cannon and one-minute fourth/centre-seconds periods agree with the counted train at 21600 bph. Original Third/Fourth/Fifth filenames map to centre/third/fourth roles. SA3120 is made by Jinghe, confirmed by Peter Hudson on 2026-10-21. APS/ZF names are retained as marketed aliases, not movement manufacturers. Genuine AP3120 and older 28800 bph Miyota 9015-based replicas are outside this contribution. Existing 53° lift setting is retained from the forum guide; photographs do not establish lift angle.",
    "escape_teeth": 20
  },
  {
    "calibre": "SA4302",
    "maker": "APS / ZF (clone)",
    "family": [
      "4302 (clone)",
      "APS 4302",
      "ZF 4302"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 52,
    "seconds": "centre",
    "wheels": [
      {
        "name": "seconds wheel",
        "period_s": 60,
        "basis": "derived: the seconds hand turns once a minute"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://forum.replica-watch.info/threads/apsf-and-zf-royal-oak-15500-w-4302-clone-caliber.10917856/page-16 (a ZF V3 timegrapher reading at 28,800, lift 52°)",
      "https://clonology.is/product/clone-ap-royal-oak-ref-15500-blue-dial-swiss-movement/ (28,800 BPH, 70 h)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "An all-in-one clone of the 4302 at 28,800 bph, about 65 to 70 h. Earlier ZF versions used a Miyota 9015 instead."
  },
  {
    "calibre": "APS 4401",
    "maker": "APS (clone)",
    "family": [
      "4401 (clone)"
    ],
    "common": true,
    "bph": 28800,
    "seconds": "small seconds at 6; centre chronograph seconds",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "inferred: carries the small seconds"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://noobfactory.us/product/aps-factory-audemars-piguet-royal-oak-chronograph-26240-steel-41mm-purple-super-clone/ (28,800 vph, 70 h)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "An integrated flyback chronograph clone of the 4401; that it is one, and its beat rate, rest only on one dealer's page. Lift angle as the 4401, probably 50 to 52°, not settled; that range rests only on one author's forum guide to lift angles."
  },
  {
    "calibre": "Seiko NH35A",
    "maker": "Seiko (SII)",
    "family": [
      "NH35",
      "NH36",
      "NH36A",
      "NH34",
      "NH34A",
      "NH37",
      "NH37A",
      "NH38",
      "NH38A",
      "NH39",
      "NH39A"
    ],
    "common": true,
    "bph": 21600,
    "lift_angle_deg": 53,
    "seconds": "centre, direct",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "Derived from the seconds hand carried by this arbor; not from beat rate alone."
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "basis": "Derived from the minute-hand/cannon-pinion arbor during normal running."
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "basis": "15 teeth counted in manufacturer illustration; escape assembly 0251 383. Applied only at 21600 bph. See docs/research/seiko-miyota-train-research.md.",
        "teeth": 15
      },
      {
        "name": "balance",
        "period_s": 0.3333333333333333,
        "basis": "Derived from 21600 bph: two beats per oscillation."
      }
    ],
    "sources": [
      "https://www.cousinsuk.com/pdf/skus/9271_nh34m.pdf (SII technical guide: 21,600 vph, lift 53°, 41 h)",
      "https://calibercorner.com/seiko-caliber-4r36/",
      "https://watchrepairtalk.com/topic/28443-let-me-try-this-again-question-about-two-center-wheels-and-where-the-hands-attach-to-the-cannon-pinion-and-inner-shaft (direct seconds on the 7S26)",
      "https://www.timemodule.com/upload/category/24/technical_guide/NH35_TG.pdf",
      "docs/research/seiko-miyota-train-research.md"
    ],
    "confidence": "derived from tooth counts",
    "notes": "NH3 technical guide covers the listed NH variants. Its second reduction wheel belongs to automatic winding, not the going train. Different hand-height parts are listed separately in the guide. Escape count is illustrated, not bench-measured. Third-wheel and barrel periods remain unestablished; no pinion-leaf counts are asserted.",
    "escape_teeth": 15
  },
  {
    "calibre": "Seiko 6R35",
    "maker": "Seiko",
    "family": [
      "6R35"
    ],
    "common": true,
    "bph": 21600,
    "lift_angle_deg": 53,
    "seconds": "centre, direct",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "Derived from the seconds hand carried by this arbor; not from beat rate alone."
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "basis": "Derived from the minute-hand/cannon-pinion arbor during normal running."
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "basis": "15 teeth counted in manufacturer illustration; escape assembly 0251 283. Applied only at 21600 bph. See docs/research/seiko-miyota-train-research.md.",
        "teeth": 15
      },
      {
        "name": "balance",
        "period_s": 0.3333333333333333,
        "basis": "Derived from 21600 bph: two beats per oscillation."
      }
    ],
    "sources": [
      "https://cousinsuk.com/pdf/skus/9509_6r35.pdf (Seiko technical guide: 21,600 vph, lift 53°, 70 h)",
      "https://calibercorner.com/seiko-caliber-6r15/ (21,600 vph, 53°, 50 h)",
      "https://cousinsuk.com/pdf/skus/9509_6r35.pdf",
      "docs/research/seiko-miyota-train-research.md"
    ],
    "confidence": "derived from tooth counts",
    "notes": "6R35 is separate from 6R15: escape, pallet, balance and barrel differ. The broad 6R alias is removed. Escape count is illustrated, not bench-measured. Third-wheel and barrel periods remain unestablished; no pinion-leaf counts are asserted.",
    "escape_teeth": 15
  },
  {
    "calibre": "Seiko 7S26",
    "maker": "Seiko",
    "family": [
      "7S26",
      "7S36"
    ],
    "common": true,
    "bph": 21600,
    "seconds": "centre, direct",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "Derived from the seconds hand carried by this arbor; not from beat rate alone."
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "basis": "Derived from the minute-hand/cannon-pinion arbor during normal running."
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "basis": "15 teeth counted in manufacturer illustration; escape assembly 0251 300 (7S26); 0251 013 (7S36). Applied only at 21600 bph. See docs/research/seiko-miyota-train-research.md.",
        "teeth": 15
      },
      {
        "name": "balance",
        "period_s": 0.3333333333333333,
        "basis": "Derived from 21600 bph: two beats per oscillation."
      }
    ],
    "sources": [
      "https://reference.grail-watch.com/movement/7s26",
      "https://watchrepairtalk.com/topic/28443-let-me-try-this-again-question-about-two-center-wheels-and-where-the-hands-attach-to-the-cannon-pinion-and-inner-shaft",
      "https://seikoserviceusa.com/uploads/datasheets/7S26A%267S36A.pdf",
      "https://seikoserviceusa.com/uploads/datasheets/7S26B_36B.pdf",
      "https://seikoserviceusa.com/uploads/datasheets/7S26C_36C.pdf",
      "docs/research/seiko-miyota-train-research.md"
    ],
    "confidence": "derived from tooth counts",
    "notes": "A/B/C escape identities are documented separately. 53-degree lift is explicitly published in the C guide; generic selection uses that setting. Escape count is illustrated, not bench-measured. Third-wheel and barrel periods remain unestablished; no pinion-leaf counts are asserted.",
    "escape_teeth": 15,
    "lift_angle_deg": 53,
    "assets": [
      {
        "path": "seiko/shared/7S26A&7S36A.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "seiko/shared/7S26B_36B.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "seiko/shared/7S26C_36C.pdf",
        "kind": "spec sheet"
      }
    ]
  },
  {
    "calibre": "Miyota 8215",
    "maker": "Miyota (Citizen)",
    "family": [
      "8215",
      "8205",
      "821A",
      "8217",
      "820A"
    ],
    "common": true,
    "bph": 21600,
    "lift_angle_deg": 49,
    "seconds": "centre, indirect",
    "wheels": [
      {
        "name": "seconds pinion",
        "period_s": 60,
        "basis": "Derived from the seconds hand carried by this arbor; not from beat rate alone."
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "basis": "Derived from the minute-hand/cannon-pinion arbor during normal running."
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "basis": "15 teeth counted in manufacturer illustration; escape assembly 032-106. Applied only at 21600 bph. See docs/research/seiko-miyota-train-research.md.",
        "teeth": 15
      },
      {
        "name": "balance",
        "period_s": 0.3333333333333333,
        "basis": "Derived from 21600 bph: two beats per oscillation."
      }
    ],
    "sources": [
      "https://calibercorner.com/miyota-caliber-8215",
      "https://www.watchrepairtalk.com/topic/20273-citizenmiyota-8200-lift-angle/ (lift 49°)",
      "https://calibercorner.com/stuttering-seconds-hand-explained",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Miyota 8215, 49°)",
      "https://miyotamovement.com/uploads/product/product_moQeV8byx0JPUZStgs.jpg",
      "https://miyotamovement.com/uploads/product/product_PveYk926HfOtdLJUux.pdf",
      "https://miyotamovement.com/product/8215/",
      "https://miyotamovement.com/uploads/product/product_TvxEGAeFoUYWz4bghI.pdf",
      "https://miyotamovement.com/uploads/product/product_LXM6qyfebUrJGPd2Wt.pdf",
      "https://om-mechanics.com/brochures/Miyota%208205%2C%208215%2C%20820A%2C%20821A.pdf",
      "docs/research/seiko-miyota-train-research.md"
    ],
    "confidence": "derived from tooth counts",
    "notes": "8215/8205/821A/820A/8217 share escape 032-106. Indirect seconds establish only the seconds-pinion period: they do not prove that the fourth wheel has either a different or identical period. Existing 49-degree lift setting retained. Escape count is illustrated, not bench-measured. Third-wheel and barrel periods remain unestablished; no pinion-leaf counts are asserted.",
    "escape_teeth": 15,
    "assets": [
      {
        "path": "miyota-citizen/miyota-8215/product_PveYk926HfOtdLJUux.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "miyota-citizen/miyota-8215/product_TvxEGAeFoUYWz4bghI.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "miyota-citizen/miyota-8215/product_LXM6qyfebUrJGPd2Wt.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "miyota-citizen/shared/product_moQeV8byx0JPUZStgs.jpg",
        "kind": "photo"
      }
    ]
  },
  {
    "calibre": "Miyota 9015",
    "maker": "Miyota (Citizen)",
    "family": [
      "9015",
      "9039",
      "90S5"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 51,
    "seconds": "centre, direct",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "Derived from the seconds hand carried by this arbor; not from beat rate alone."
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "Derived from the minute-hand/cannon-pinion arbor during normal running."
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "basis": "20 teeth counted in manufacturer illustration; escape assembly 032-991. Applied only at 28800 bph. See docs/research/seiko-miyota-train-research.md.",
        "teeth": 20
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "Derived from 28800 bph: two beats per oscillation."
      }
    ],
    "sources": [
      "https://miyotamovement.com/jp/uploads/product/product_VFYbHra8C0WGl4Nge3.pdf (Miyota spec: 28,800 vph, 51°, 42 h)",
      "https://calibercorner.com/miyota-caliber-9015/",
      "https://calibercorner.com/miyota-caliber-9039/ (no date, 28,800 vph, 51°)",
      "https://miyotamovement.com/uploads/product/product_cAzkTHoO04Nhn9rI86.jpg",
      "https://miyotamovement.com/uploads/product/product_6VYkM4Gnta0BQXiULu.pdf",
      "https://miyotamovement.com/product/9015/",
      "https://miyotamovement.com/uploads/product/product_5QPkALupsnd4cVrOJ2.pdf",
      "https://miyotamovement.com/product/9039/",
      "https://miyotamovement.com/uploads/product/product_2UcVxZDJMtkysqIT8n.pdf",
      "https://miyotamovement.com/product/90S5/",
      "docs/research/seiko-miyota-train-research.md"
    ],
    "confidence": "derived from tooth counts",
    "notes": "9015/9039/90S5 use the same escape assembly. The former one-hour centre-wheel entry is replaced by the cannon pinion: the off-centre centre wheel has no established period. Existing 51-degree lift setting retained. Escape count is illustrated, not bench-measured. Third-wheel and barrel periods remain unestablished; no pinion-leaf counts are asserted.",
    "escape_teeth": 20,
    "assets": [
      {
        "path": "miyota-citizen/miyota-9015/product_VFYbHra8C0WGl4Nge3.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "miyota-citizen/miyota-9015/product_6VYkM4Gnta0BQXiULu.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "miyota-citizen/miyota-9015/product_5QPkALupsnd4cVrOJ2.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "miyota-citizen/miyota-9015/product_2UcVxZDJMtkysqIT8n.pdf",
        "kind": "spec sheet"
      },
      {
        "path": "miyota-citizen/shared/product_cAzkTHoO04Nhn9rI86.jpg",
        "kind": "photo"
      }
    ]
  },
  {
    "calibre": "Seagull ST19",
    "maker": "Tianjin Seagull",
    "family": [
      "ST1901",
      "ST19"
    ],
    "common": true,
    "bph": 21600,
    "seconds": "small seconds at 9 (fourth wheel); centre chronograph seconds",
    "wheels": [
      {
        "name": "fourth wheel",
        "period_s": 60,
        "basis": "derived: carries the small seconds"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://reference.grail-watch.com/movement/st1901/",
      "https://calibercorner.com/seagull-caliber-st-1901b"
    ],
    "confidence": "derived from the beat rate",
    "notes": "Based on the Venus 175 column-wheel chronograph. Lift angle not documented. About 50 h, 45 h with the chronograph running."
  },
  {
    "calibre": "Seagull ST2130",
    "maker": "Tianjin Seagull",
    "family": [
      "ST2130",
      "TY2130"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 50,
    "seconds": "centre",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 21114.027149321268,
        "teeth": 101,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md."
      },
      {
        "name": "centre wheel",
        "period_s": 3553.846153846154,
        "teeth": 77,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 17
      },
      {
        "name": "third wheel",
        "period_s": 600.0,
        "teeth": 90,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 13
      },
      {
        "name": "fourth wheel",
        "period_s": 60.0,
        "teeth": 108,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "escape wheel",
        "period_s": 5.0,
        "teeth": 20,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md.",
        "pinion": 9
      },
      {
        "name": "cannon pinion",
        "period_s": 3600.0,
        "teeth": 78,
        "basis": "INFERRED family transfer under contributor-reported 28,800 bph 2824 applicability; period derived from tooth counts. See docs/research/2824-train-wheel-counts.md. 78-tooth driver wheel and 16-leaf cannon pinion share the one-hour arbor; third-to-cannon mesh inferred from exact ratio, not bench-confirmed.",
        "pinion": 16
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from 28800 bph"
      }
    ],
    "sources": [
      "https://calibercorner.com/seagull-caliber-ty2130",
      "https://en.seagullwatch.com/products/hands-date-movement-ty2130-st2130 (Maker's page) (\"Frequency: 28800 (no unit stated on page)\")",
      "docs/research/2824-train-wheel-counts.md (Peter Hudson microscope photographs, 2026-10-19; counted base train, explicit variant applicability)",
      "Peter Hudson, 2026-10-22: lift angle 50° for all ETA 2824-2 movements and their derivatives, clones and variations"
    ],
    "confidence": "inferred family transfer",
    "notes": "28,800 bph 2824 base train only. The centre wheel slot denotes the off-centre second/intermediate wheel (77/17), not the one-hour cannon pinion. The third pinion (13) drives the cannon wheel (78): 600 x 78/13 = 3600 s. Barrel running period is 4666200/221 s; this is not power reserve. See the evidence document for applicability and exclusions. Train counts are transferred from the photographed base, not separately measured on this variant. Seagull publishes the beat rate; equality of the base train is a family inference under contributor coverage. The 50° lift angle is Peter Hudson's figure for all 2824-2 movements and their derivatives, clones and variations (2026-10-22); it is not inferred from the shared train."
  },
  {
    "calibre": "PTS DG2813",
    "maker": "Various Chinese makers",
    "family": [
      "DG2813",
      "2813"
    ],
    "common": true,
    "bph": 21600,
    "seconds": "centre",
    "wheels": [
      {
        "name": "seconds wheel",
        "period_s": 60,
        "basis": "derived: the seconds hand turns once a minute"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "basis": "inferred: on the Miyota 8200 framework"
      },
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://calibercorner.com/pts-caliber-dg-2813/"
    ],
    "confidence": "derived from the beat rate",
    "notes": "On the Miyota 8200 framework but not a direct copy; about 36 h. Lift angle not documented."
  },
  {
    "calibre": "Patek Philippe 324 S C",
    "maker": "Patek Philippe",
    "family": [
      "324 S C",
      "324",
      "324 S QA LU",
      "324 S C FUS"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 52,
    "seconds": "centre, indirect (a centre seconds wheel held by a friction spring)",
    "wheels": [
      {
        "name": "seconds wheel",
        "period_s": 60,
        "basis": "derived: the seconds hand turns once a minute"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "basis": "derived: carries the minute hand"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://wiki.grail-watch.com/index.php/PP_324",
      "https://watchbase.com/patek-philippe/caliber/324-s-c-fus-ar",
      "https://www.watchprosite.com/watchtech/new-engine-for-patek-philippe-5711-/1223.1275781.10746571/ (the 26-330 replaced the 324's friction-spring seconds)",
      "https://www.watchprosite.com/patek-philippe/324sc-movement/11.1156881.9063951/ (does not hack)",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)"
    ],
    "confidence": "derived from the beat rate",
    "notes": "Indirect centre seconds is inferred from what its successor, the 26-330, changed. Does not hack. 35 to 45 h. Patek publishes no lift angle; 52° is the clone timegrapher guide's. No tooth counts found."
  },
  {
    "calibre": "Dandong 324",
    "maker": "Peacock (Dandong)",
    "family": [
      "324 (clone)",
      "DD324",
      "Dandong 324 S C"
    ],
    "common": true,
    "bph": 28800,
    "escape_teeth": 20,
    "lift_angle_deg": 52,
    "seconds": "indirect centre: third-wheel rim drives a separate 9-leaf seconds pinion",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 18600,
        "teeth": 93,
        "basis": "photographed DD324 tooth counts, Peter Hudson, 2026-10-21; 3600 × 93/18 = 18600 s for the running drum"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 60,
        "pinion": 18,
        "basis": "photographed DD324 tooth counts, Peter Hudson, 2026-10-21; second wheel in the centre-wheel slot; 600 × 60/10 = 3600 s"
      },
      {
        "name": "third wheel",
        "period_s": 600,
        "teeth": 90,
        "pinion": 10,
        "basis": "photographed DD324 tooth counts, Peter Hudson, 2026-10-21; 10 leaves on each face; seconds 60 × 90/9 and cannon 3600 × 10/60 independently give 600 s"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 84,
        "pinion": 9,
        "basis": "photographed DD324 tooth counts, Peter Hudson, 2026-10-21; 600 × 9/90 = 60 s; both counts directly visible in the fourth-wheel photograph"
      },
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 7,
        "basis": "photographed DD324 tooth counts, Peter Hudson, 2026-10-21; 60 × 7/84 = 5 s, independently 20 × 7200/28800 = 5 s"
      },
      {
        "name": "seconds pinion",
        "period_s": 60,
        "pinion": 9,
        "basis": "photographed DD324 tooth counts, Peter Hudson, 2026-10-21; separate indirect seconds arbor: 600 × 9/90 = 60 s, matching the contributor hand-period constraint"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "teeth": 60,
        "pinion": 28,
        "basis": "photographed DD324 tooth counts, Peter Hudson, 2026-10-21; 60-tooth cannon wheel driven by the third wheel’s 10-leaf pinion: 600 × 60/10 = 3600 s; 28 leaves belong to the motion works"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "Project bench measurement: 28,800 vph, does not hack",
      "https://forum.replica-watch.info/threads/guide-how-to-understand-the-timegrapher-video-during-qc.11019462/ (lift angles used for clone and genuine calibres)",
      "docs/research/dd324-train-wheel-counts.md — Peter Hudson, eight DD324 microscope photographs and confirmed SL1258 train applicability, 2026-10-21",
      "Prior bench observation: 60 s rate and amplitude cycle in aquanaut324_DU_30min; not sufficient alone to distinguish fourth wheel from indirect seconds pinion"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Full DD324 train counted from eight photographs: barrel 93, second 60/18, third 90 with 10 leaves on both faces, fourth 84/9, escape 20/7. The centre-wheel slot represents the second wheel; indirect seconds uses a separate 9-leaf pinion driven by the third-wheel rim. The 60-tooth cannon wheel is driven by the third wheel’s 10-leaf pinion; its own 28 leaves serve the motion works. Barrel drum period 18600 s (5 h 10 min), not power reserve. The photographed fourth wheel resolves the earlier underdetermined 28:3 ratio. Genuine Patek 324 entries are outside this contribution. Does not hack per existing bench notes. The retained 52° lift angle comes from the existing forum guide, not these tooth counts."
  },
  {
    "calibre": "Peacock SL1258",
    "maker": "Peacock (Dandong)",
    "family": [
      "SL1258"
    ],
    "common": true,
    "bph": 28800,
    "lift_angle_deg": 53.0,
    "escape_teeth": 20,
    "seconds": "indirect centre: third-wheel rim drives a separate 9-leaf seconds pinion",
    "wheels": [
      {
        "name": "barrel",
        "period_s": 18600,
        "teeth": 93,
        "basis": "INFERRED family transfer: Peter Hudson confirms the DD324 counts for the SL1258 train; 3600 × 93/18 = 18600 s for the running drum"
      },
      {
        "name": "centre wheel",
        "period_s": 3600,
        "teeth": 60,
        "pinion": 18,
        "basis": "INFERRED family transfer: Peter Hudson confirms the DD324 counts for the SL1258 train; second wheel in the centre-wheel slot; 600 × 60/10 = 3600 s"
      },
      {
        "name": "third wheel",
        "period_s": 600,
        "teeth": 90,
        "pinion": 10,
        "basis": "INFERRED family transfer: Peter Hudson confirms the DD324 counts for the SL1258 train; 10 leaves on each face; seconds 60 × 90/9 and cannon 3600 × 10/60 independently give 600 s"
      },
      {
        "name": "fourth wheel",
        "period_s": 60,
        "teeth": 84,
        "pinion": 9,
        "basis": "INFERRED family transfer: Peter Hudson confirms the DD324 counts for the SL1258 train; 600 × 9/90 = 60 s; both counts directly visible in the fourth-wheel photograph"
      },
      {
        "name": "escape wheel",
        "period_s": 5,
        "teeth": 20,
        "pinion": 7,
        "basis": "INFERRED family transfer: Peter Hudson confirms the DD324 counts for the SL1258 train; 60 × 7/84 = 5 s, independently 20 × 7200/28800 = 5 s"
      },
      {
        "name": "seconds pinion",
        "period_s": 60,
        "pinion": 9,
        "basis": "INFERRED family transfer: Peter Hudson confirms the DD324 counts for the SL1258 train; separate indirect seconds arbor: 600 × 9/90 = 60 s, matching the contributor hand-period constraint"
      },
      {
        "name": "cannon pinion",
        "period_s": 3600,
        "teeth": 60,
        "pinion": 28,
        "basis": "INFERRED family transfer: Peter Hudson confirms the DD324 counts for the SL1258 train; 60-tooth cannon wheel driven by the third wheel’s 10-leaf pinion: 600 × 60/10 = 3600 s; 28 leaves belong to the motion works"
      },
      {
        "name": "balance",
        "period_s": 0.25,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "This project's bench recordings: a 5.00 s rate cycle locked to 40 beats (one escape-wheel turn at 20 teeth)",
      "Project bench notes: like the Dandong 324, with a monolithic bridge",
      "http://en.cpeacockmovement.com/Movement_detail/56.html (Maker's page) (\"Frequency: 28800 Vibrations/Hr\")",
      "docs/research/dd324-train-wheel-counts.md — Peter Hudson, eight DD324 microscope photographs and confirmed SL1258 train applicability, 2026-10-21",
      "Prior bench observations: 5 s rate cycle in peacock1258_DU_30min and a 60.03 s amplitude cycle; the latter does not distinguish fourth wheel from indirect seconds pinion",
      "https://omo-oss-file110.thefastfile.com/portal-saas/new2022072209103961414/cms/file/SL1258-0003%20%E6%9C%BA%E5%BF%83%E5%A4%96%E5%BB%93%E5%9B%BE.pdf (Peacock (辽宁孔雀表业 / 孔雀表业集团) outline drawing 机芯外廓图 SL1258-0003, dated 2024-01-18, read on Peacock's site on 2026-11-16) (升角 (lift angle) 53°, 频率 28800次/小时, 32 jewels, φ27 mm, 3.4 mm thick)",
      "https://omo-oss-file110.thefastfile.com/portal-saas/new2022072209103961414/cms/file/a9913012-3e17-4595-8938-d9ea6d68f6c6.pdf (Peacock (辽宁孔雀表业 / 孔雀表业集团) outline drawing 机芯外廓图 SL1258-0003, dated 2023-01-28, read on Peacock's site on 2026-11-16) (升角 (lift angle) 53°, 频率 28800次/小时, 32 jewels, φ27 mm, 3.4 mm thick)"
    ],
    "confidence": "derived from tooth counts",
    "notes": "Full DD324 train counted from eight photographs: barrel 93, second 60/18, third 90 with 10 leaves on both faces, fourth 84/9, escape 20/7. The centre-wheel slot represents the second wheel; indirect seconds uses a separate 9-leaf pinion driven by the third-wheel rim. The 60-tooth cannon wheel is driven by the third wheel’s 10-leaf pinion; its own 28 leaves serve the motion works. Barrel drum period 18600 s (5 h 10 min), not power reserve. Counts are transferred from the DD324 specimen on the contributor’s confirmation that SL1258 and variants retaining this train match; no separate SL1258 wheel set was photographed. Earlier bench takes used 52° as a setting; the maker's drawings give 53°. Lift angle 53° and 28,800 bph from Peacock's own outline drawings (SL1258-0003 2024-01-18, SL1258-0003 2023-01-28). Center Hr/Min/Sec hands; 3H: Date by window/Corrector; Auto & Hand winding; 32 jewels; 27 mm across, 3.4 mm thick; power reserve ≥38 h."
  },
  {
    "calibre": "Agassiz 8 PCV",
    "maker": "Agassiz",
    "bph": 20222,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.356048,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AGASSIZ 8 PCV, 20222 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Agassiz PCV/ AO/ Z 7",
    "maker": "Agassiz",
    "bph": 20944,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.343774,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AGASSIZ PCV/ AO/ Z, 20944.4 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Agassiz 8 AC",
    "maker": "Agassiz",
    "bph": 21600,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AGASSIZ 8 AC, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 355",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 44.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 355, 44°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 355, 44°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 355, 44°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 365",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 44.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 365, 44°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 365, 44°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 365, 44°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 413",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 44.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 413, 44°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 413, 44°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 413, 44°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 447",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 51.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 447, 51°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 447, 51°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 447, 51°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 459",
    "maker": "Alpina",
    "bph": 19800,
    "lift_angle_deg": 51.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.363636,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 459, 51°, 19800 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 459, 51°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 459, 51°, 19800 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 466",
    "maker": "Alpina",
    "bph": 19800,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.363636,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 466, 52°, 19800 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 466, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 466, 52°, 19800 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 1476",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 1476, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 1476, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 1476, 52°)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 490",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 490, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 490, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 490, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 554",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 554, 52°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 554, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 554, 52°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 556",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 556, 52°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 556, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 556, 52°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 562",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 51.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 562, 51°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 562, 51°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 562, 51°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 563",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 563, 52°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 563, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 563, 52°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 564",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 564, 52°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 564, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 564, 52°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 566",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 566, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 566, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 566, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 568",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 568, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 568, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 568, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 570",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 51.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 570, 51°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 570, 51°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 570, 51°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 571 C",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 571 C, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 571C, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 571C, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 572C",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 572C, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 572C, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 572C, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 573C",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 573C, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 573C, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 573C, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 581 C",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 581 C, 52°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 581C, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 581C, 52°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 582",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 582, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 582, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 582, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 584",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 584, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 584, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 584, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 586",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 586, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 586, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 586, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 588",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 588, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 588, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 588, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 590",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 590, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 590, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 590, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 594",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 594, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 594, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 594, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 592",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 592, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 592, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 592, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 598",
    "maker": "Alpina",
    "bph": 18000,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 598, 52°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 598, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 598, 52°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 596",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 52.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 596, 52°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 596, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 596, 52°)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Alpina 718",
    "maker": "Alpina",
    "bph": 21600,
    "lift_angle_deg": 51.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (ALPINA STRAUB 718, 51°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Alpina 718, 51°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Alpina Straub 718, 51°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 80",
    "maker": "Arogno",
    "lift_angle_deg": 52.0,
    "wheels": [],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 80, 52°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 80, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 80, 52°)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 151",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 49.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 151, 49°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 151, 49°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 151, 49°)",
      "https://ranfft.org/caliber/398-Arogno-151 (Ranfft: Arogno 151, read 2026-11-17) (18000 bph, 49°)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 190 N",
    "maker": "Arogno",
    "lift_angle_deg": 52.0,
    "wheels": [],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 190 N, 52°)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 190N, 52°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 190N, 52°)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 22",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 45.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 22, 45°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 22, 45°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 22, 45°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 23",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 45.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 23, 45°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 23, 45°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 23, 45°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 24",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 45.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 24, 45°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 24, 45°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 24, 45°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 25",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 45.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 25, 45°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 25, 45°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 25, 45°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 26",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 45.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 26, 45°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 26, 45°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 26, 45°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 27",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 45.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 27, 45°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 27, 45°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 27, 45°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 28",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 45.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 28, 45°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 28, 45°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 28, 45°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 29",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 45.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 29, 45°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 29, 45°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 29, 45°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 152",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 49.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 152, 49°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 152, 49°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 152, 49°)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 156",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 49.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 156, 49°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 156, 49°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 156, 49°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 157",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 49.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 157, 49°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 157, 49°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 157, 49°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 7320",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 43.5,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 7320, 43.5°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 7320, 43.5°, 18000 vph)",
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 7320, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 7325",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 43.5,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 7325, 43.5°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 7325, 43.5°, 18000 vph)",
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 7325, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 7326",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 43.5,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 7326, 43.5°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 7326, 43.5°, 18000 vph)",
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 7326, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Arogno 7330",
    "maker": "Arogno",
    "bph": 18000,
    "lift_angle_deg": 43.5,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://watchguy.co.uk/cgi-bin/lift_angles (Arogno 7330, 43.5°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Arogno 7330, 43.5°, 18000 vph)",
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AROGNO 7330, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet 2001",
    "maker": "Audemars Piguet",
    "bph": 18000,
    "lift_angle_deg": 56.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 2001, 56°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 2001, 56°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 2001, 56°)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet 2002",
    "maker": "Audemars Piguet",
    "bph": 18000,
    "lift_angle_deg": 56.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 2002, 56°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 2002, 56°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 2002, 56°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet 2003",
    "maker": "Audemars Piguet",
    "bph": 18000,
    "lift_angle_deg": 56.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 2003, 56°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 2003, 56°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 2003, 56°, 18000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet 2005",
    "maker": "Audemars Piguet",
    "bph": 19800,
    "lift_angle_deg": 54.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.363636,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 2005, 54°, 19800 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 2005, 54°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 2005, 54°, 19800 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet 2050",
    "maker": "Audemars Piguet",
    "bph": 19800,
    "lift_angle_deg": 56.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.363636,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 2050, 56°, 19800 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 2050, 56°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 2050, 56°, 19800 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet 2430",
    "maker": "Audemars Piguet",
    "bph": 21600,
    "lift_angle_deg": 58.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.333333,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 2430, 58°, 21600 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 2430, 58°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 2430, 58°, 21600 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet 5007",
    "maker": "Audemars Piguet",
    "bph": 18000,
    "lift_angle_deg": 38.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.4,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET 5007, 38°, 18000 vph)",
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 5007, 38°)"
    ],
    "confidence": "published list",
    "notes": "Sources disagree; kept as separate entries. Others give 19,800 bph and 38° (WatchGuy, Watchmaking Tools)."
  },
  {
    "calibre": "Audemars Piguet 5007 (19,800 bph, 38°)",
    "maker": "Audemars Piguet",
    "former_names": [
      "Audemars Piguet 5007 (19,800 vph, 38°)"
    ],
    "bph": 19800,
    "lift_angle_deg": 38.0,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.363636,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://watchguy.co.uk/cgi-bin/lift_angles (Audemars Piguet 5007, 38°)",
      "https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles/ (Audemars-Piguet 5007, 38°, 19800 vph)"
    ],
    "confidence": "published list",
    "notes": "Sources disagree; kept as separate entries. Others give 18,000 bph and 38° (WatchGuy, the lift-angle sheet)."
  },
  {
    "calibre": "Audemars Piguet SB 5/7”",
    "maker": "Audemars Piguet",
    "bph": 20222,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.356048,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET SB, 20222 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet Rond 8”",
    "maker": "Audemars Piguet",
    "bph": 20222,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.356048,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET Rond, 20222 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet HBT 6”",
    "maker": "Audemars Piguet",
    "bph": 20944,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.343774,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET HBT, 20944.4 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet Ovale 6/7”",
    "maker": "Audemars Piguet",
    "bph": 20944,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.343774,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET Ovale, 20944.4 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet Ovale 8”",
    "maker": "Audemars Piguet",
    "bph": 20944,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.343774,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET Ovale, 20944.4 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet RBG 7”",
    "maker": "Audemars Piguet",
    "bph": 21000,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.342857,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET RBG, 21000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet LRB 8”",
    "maker": "Audemars Piguet",
    "bph": 21000,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.342857,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET LRB, 21000 vph)"
    ],
    "confidence": "published list"
  },
  {
    "calibre": "Audemars Piguet Rond 6/7”",
    "maker": "Audemars Piguet",
    "bph": 21030,
    "wheels": [
      {
        "name": "balance",
        "period_s": 0.342368,
        "basis": "derived from the beat rate"
      }
    ],
    "sources": [
      "https://docs.google.com/spreadsheets/d/teAKORqEYkv8yFz96BRHbkg (lift angle sheet linked from watchrepairtalk.com/topic/27749-lift-angle) (AUDEMARS-PIGUET Rond, 21030 vph)"
    ],
    "confidence": "published list",
    "notes": "Sources disagree; kept as separate entries. Others give 21,031 bph (the lift-angle sheet)."
  },
  {
    "calibre": "Audemars Piguet Rond 6/7” (21,0
…[truncated]