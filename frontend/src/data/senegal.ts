// All 14 regions, 45 departments, and major communes of Senegal
// Coordinates: [lng, lat]

export interface Region {
  name: string
  center: [number, number]
  departments: Department[]
}

export interface Department {
  name: string
  center: [number, number]
  communes: Commune[]
}

export interface Commune {
  name: string
  coords: [number, number]
  population?: number
  type: 'ville' | 'commune_rurale' | 'arrondissement'
}

export const SENEGAL_REGIONS: Region[] = [
  {
    name: 'Dakar',
    center: [-17.4677, 14.7167],
    departments: [
      {
        name: 'Dakar',
        center: [-17.4439, 14.6928],
        communes: [
          { name: 'Dakar Plateau', coords: [-17.4400, 14.6928], population: 125000, type: 'commune_rurale' },
          { name: 'Médina', coords: [-17.4530, 14.6900], population: 137000, type: 'commune_rurale' },
          { name: 'Plateau', coords: [-17.4400, 14.6950], population: 35000, type: 'commune_rurale' },
          { name: 'Grand Dakar', coords: [-17.4700, 14.7050], population: 250000, type: 'commune_rurale' },
          { name: 'Parcelles Assainies', coords: [-17.4900, 14.7100], population: 350000, type: 'commune_rurale' },
          { name: 'Mermoz-Sacré Cœur', coords: [-17.4750, 14.7000], population: 130000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Guédiawaye',
        center: [-17.4194, 14.7772],
        communes: [
          { name: 'Guédiawaye', coords: [-17.4194, 14.7772], population: 200000, type: 'commune_rurale' },
          { name: 'Sam Notaire', coords: [-17.4250, 14.7800], population: 90000, type: 'commune_rurale' },
          { name: 'Wakhinane', coords: [-17.4300, 14.7850], population: 70000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Pikine',
        center: [-17.4333, 14.7500],
        communes: [
          { name: 'Pikine', coords: [-17.4333, 14.7500], population: 300000, type: 'commune_rurale' },
          { name: 'Thiaroye', coords: [-17.4400, 14.7450], population: 200000, type: 'commune_rurale' },
          { name: 'Keur Damel', coords: [-17.4250, 14.7400], population: 100000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Rufisque',
        center: [-17.2167, 14.7167],
        communes: [
          { name: 'Rufisque', coords: [-17.2167, 14.7167], population: 250000, type: 'ville' },
          { name: 'Bargny', coords: [-17.2300, 14.7200], population: 50000, type: 'commune_rurale' },
          { name: 'Sébikotane', coords: [-17.2600, 14.7200], population: 30000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Diourbel',
    center: [-16.2351, 14.6561],
    departments: [
      {
        name: 'Diourbel',
        center: [-16.2351, 14.6561],
        communes: [
          { name: 'Diourbel', coords: [-16.2351, 14.6561], population: 100000, type: 'ville' },
          { name: 'Mbédiène', coords: [-16.2200, 14.6600], population: 15000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Mbacké',
        center: [-15.9167, 14.8000],
        communes: [
          { name: 'Mbacké', coords: [-15.9167, 14.8000], population: 80000, type: 'ville' },
          { name: 'Touba', coords: [-15.8833, 14.8167], population: 750000, type: 'ville' },
          { name: 'Coki', coords: [-15.9300, 14.7900], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Bambey',
        center: [-16.3333, 14.5333],
        communes: [
          { name: 'Bambey', coords: [-16.3333, 14.5333], population: 25000, type: 'ville' },
          { name: 'Diamaguène', coords: [-16.3500, 14.5200], population: 5000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Fatick',
    center: [-16.4025, 14.3394],
    departments: [
      {
        name: 'Fatick',
        center: [-16.4025, 14.3394],
        communes: [
          { name: 'Fatick', coords: [-16.4025, 14.3394], population: 30000, type: 'ville' },
          { name: 'Tattaguine', coords: [-16.4200, 14.3200], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Foundiougne',
        center: [-16.4667, 14.4167],
        communes: [
          { name: 'Foundiougne', coords: [-16.4667, 14.4167], population: 10000, type: 'commune_rurale' },
          { name: 'Karang', coords: [-16.4800, 14.4300], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Sokone',
        center: [-16.4833, 14.2833],
        communes: [
          { name: 'Sokone', coords: [-16.4833, 14.2833], population: 15000, type: 'commune_rurale' },
          { name: 'Guinguio', coords: [-16.5000, 14.2700], population: 5000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Kaffrine',
    center: [-15.5519, 14.1063],
    departments: [
      {
        name: 'Kaffrine',
        center: [-15.5519, 14.1063],
        communes: [
          { name: 'Kaffrine', coords: [-15.5519, 14.1063], population: 20000, type: 'ville' },
        ],
      },
      {
        name: 'Malem Hodar',
        center: [-15.4333, 14.1833],
        communes: [
          { name: 'Malem Hodar', coords: [-15.4333, 14.1833], population: 8000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Koungheul',
        center: [-15.3500, 14.0333],
        communes: [
          { name: 'Koungheul', coords: [-15.3500, 14.0333], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Rémyca',
        center: [-15.6167, 14.0667],
        communes: [
          { name: 'Rémyca', coords: [-15.6167, 14.0667], population: 5000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Kaolack',
    center: [-16.0731, 14.1518],
    departments: [
      {
        name: 'Kaolack',
        center: [-16.0731, 14.1518],
        communes: [
          { name: 'Kaolack', coords: [-16.0731, 14.1518], population: 250000, type: 'ville' },
          { name: 'Ndiago', coords: [-16.0600, 14.1400], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Guinguio',
        center: [-15.8500, 14.2333],
        communes: [
          { name: 'Guinguio', coords: [-15.8500, 14.2333], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Ndangane',
        center: [-15.9333, 14.0833],
        communes: [
          { name: 'Ndangane', coords: [-15.9333, 14.0833], population: 8000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Kolda',
    center: [-14.9413, 12.8944],
    departments: [
      {
        name: 'Kolda',
        center: [-14.9413, 12.8944],
        communes: [
          { name: 'Kolda', coords: [-14.9413, 12.8944], population: 60000, type: 'ville' },
          { name: 'Médina Chérif', coords: [-14.9500, 12.8800], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Médina Yoro Foulah',
        center: [-14.8167, 13.1500],
        communes: [
          { name: 'Médina Yoro Foulah', coords: [-14.8167, 13.1500], population: 15000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Vélingara',
        center: [-14.5667, 12.7167],
        communes: [
          { name: 'Vélingara', coords: [-14.5667, 12.7167], population: 10000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Kédougou',
    center: [-12.1747, 12.5571],
    departments: [
      {
        name: 'Kédougou',
        center: [-12.1747, 12.5571],
        communes: [
          { name: 'Kédougou', coords: [-12.1747, 12.5571], population: 15000, type: 'ville' },
        ],
      },
      {
        name: 'Salémata',
        center: [-12.3333, 12.6333],
        communes: [
          { name: 'Salémata', coords: [-12.3333, 12.6333], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Saraya',
        center: [-12.4833, 12.4833],
        communes: [
          { name: 'Saraya', coords: [-12.4833, 12.4833], population: 5000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Louga',
    center: [-16.2271, 15.6184],
    departments: [
      {
        name: 'Louga',
        center: [-16.2271, 15.6184],
        communes: [
          { name: 'Louga', coords: [-16.2271, 15.6184], population: 50000, type: 'ville' },
          { name: 'Cobacouta', coords: [-16.2400, 15.6300], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Kébémer',
        center: [-16.3167, 15.5333],
        communes: [
          { name: 'Kébémer', coords: [-16.3167, 15.5333], population: 15000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Linguère',
        center: [-16.0833, 15.4167],
        communes: [
          { name: 'Linguère', coords: [-16.0833, 15.4167], population: 20000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Matam',
    center: [-13.2553, 15.6561],
    departments: [
      {
        name: 'Matam',
        center: [-13.2553, 15.6561],
        communes: [
          { name: 'Matam', coords: [-13.2553, 15.6561], population: 15000, type: 'ville' },
          { name: 'Ourossogui', coords: [-13.2800, 15.6400], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Kanel',
        center: [-13.1167, 15.5667],
        communes: [
          { name: 'Kanel', coords: [-13.1167, 15.5667], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Ranérou',
        center: [-13.6333, 15.7167],
        communes: [
          { name: 'Ranérou', coords: [-13.6333, 15.7167], population: 5000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Saint-Louis',
    center: [-16.4803, 16.0326],
    departments: [
      {
        name: 'Saint-Louis',
        center: [-16.4803, 16.0326],
        communes: [
          { name: 'Saint-Louis', coords: [-16.4803, 16.0326], population: 230000, type: 'ville' },
          { name: 'Gandon', coords: [-16.5000, 16.0500], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Podor',
        center: [-16.1333, 16.3667],
        communes: [
          { name: 'Podor', coords: [-16.1333, 16.3667], population: 15000, type: 'commune_rurale' },
          { name: 'Gaé', coords: [-16.1500, 16.3800], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: ' Dagana',
        center: [-16.0000, 16.2500],
        communes: [
          { name: 'Richard Toll', coords: [-15.9500, 16.2833], population: 25000, type: 'ville' },
          { name: 'Podor', coords: [-16.1333, 16.3667], population: 15000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Sédhiou',
    center: [-15.5564, 12.7081],
    departments: [
      {
        name: 'Sédhiou',
        center: [-15.5564, 12.7081],
        communes: [
          { name: 'Sédhiou', coords: [-15.5564, 12.7081], population: 20000, type: 'ville' },
        ],
      },
      {
        name: 'Bignona',
        center: [-15.5333, 12.8333],
        communes: [
          { name: 'Bignona', coords: [-15.5333, 12.8333], population: 15000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Oussouye',
        center: [-15.7167, 12.5333],
        communes: [
          { name: 'Oussouye', coords: [-15.7167, 12.5333], population: 8000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Tambacounda',
    center: [-13.6673, 13.7709],
    departments: [
      {
        name: 'Tambacounda',
        center: [-13.6673, 13.7709],
        communes: [
          { name: 'Tambacounda', coords: [-13.6673, 13.7709], population: 50000, type: 'ville' },
          { name: 'Bakel', coords: [-13.8167, 13.8500], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Bakel',
        center: [-13.8167, 13.8500],
        communes: [
          { name: 'Bakel', coords: [-13.8167, 13.8500], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Goudiry',
        center: [-13.4167, 13.9833],
        communes: [
          { name: 'Goudiry', coords: [-13.4167, 13.9833], population: 8000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Koumpentoum',
        center: [-13.9667, 13.6833],
        communes: [
          { name: 'Koumpentoum', coords: [-13.9667, 13.6833], population: 5000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Thiès',
    center: [-16.9266, 14.7886],
    departments: [
      {
        name: 'Thiès',
        center: [-16.9266, 14.7886],
        communes: [
          { name: 'Thiès', coords: [-16.9266, 14.7886], population: 400000, type: 'ville' },
          { name: 'Notto', coords: [-16.9400, 14.8000], population: 30000, type: 'commune_rurale' },
          { name: 'Thiès Nord', coords: [-16.9300, 14.8000], population: 150000, type: 'commune_rurale' },
          { name: 'Thiès Sud', coords: [-16.9300, 14.7800], population: 120000, type: 'commune_rurale' },
        ],
      },
      {
        name: "M'Bayar",
        center: [-16.9667, 14.8500],
        communes: [
          { name: "M'Bayar", coords: [-16.9667, 14.8500], population: 20000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Mékhe',
        center: [-16.8667, 15.0167],
        communes: [
          { name: 'Mékhe', coords: [-16.8667, 15.0167], population: 15000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Tivaouane',
        center: [-16.8167, 14.9500],
        communes: [
          { name: 'Tivaouane', coords: [-16.8167, 14.9500], population: 10000, type: 'commune_rurale' },
          { name: 'Mellacolé', coords: [-16.8300, 14.9600], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Joal-Fadiouth',
        center: [-16.8167, 14.4833],
        communes: [
          { name: 'Joal', coords: [-16.8167, 14.4833], population: 20000, type: 'commune_rurale' },
          { name: 'Fadiouth', coords: [-16.8100, 14.4800], population: 5000, type: 'commune_rurale' },
        ],
      },
    ],
  },
  {
    name: 'Ziguinchor',
    center: [-16.2722, 12.5644],
    departments: [
      {
        name: 'Ziguinchor',
        center: [-16.2722, 12.5644],
        communes: [
          { name: 'Ziguinchor', coords: [-16.2722, 12.5644], population: 100000, type: 'ville' },
          { name: 'Boucotte', coords: [-16.2800, 12.5700], population: 5000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Bignona',
        center: [-16.2167, 12.7833],
        communes: [
          { name: 'Bignona', coords: [-16.2167, 12.7833], population: 10000, type: 'commune_rurale' },
        ],
      },
      {
        name: 'Oussouye',
        center: [-16.5000, 12.4833],
        communes: [
          { name: 'Oussouye', coords: [-16.5000, 12.4833], population: 5000, type: 'commune_rurale' },
        ],
      },
    ],
  },
]

// Flatten all communes for search
export const ALL_COMMUNES = SENEGAL_REGIONS.flatMap((r) =>
  r.departments.flatMap((d) =>
    d.communes.map((c) => ({
      ...c,
      department: d.name,
      region: r.name,
    }))
  )
)

// Flatten all departments
export const ALL_DEPARTMENTS = SENEGAL_REGIONS.flatMap((r) =>
  r.departments.map((d) => ({
    ...d,
    region: r.name,
  }))
)

export const SENEGAL_CENTER: [number, number] = [-14.4524, 14.4974]
