// TODO load these from a backend api, db sourced

const activityTypes = [
    {
        id: 1,
        name: 'Fertilize',
        subTypes: [
            {
                id: 1,
                name: 'Bone Meal',
            },
            {
                id: 2,
                name: 'Blood Meal',
            },
            {
                id: 3,
                name: 'Fish Emulsion',
            },
            {
                id: 4,
                name: 'Worm Castings',
            },
            {
                id: 5,
                name: 'Calcium/Magnesium Supplement',
            },
            {
                id: 6,
                name: 'Water Soluble All Purpose',
            },
            {
                id: 7,
                name: 'Granular Slow Release',
            },
        ],
    },
    {
        id: 2,
        name: 'Treatment',
        subTypes: [
            {
                id: 1,
                name: 'Fungicide',
            },
            {
                id: 2,
                name: 'BT Thuricide',
            },
            {
                id: 3,
                name: 'Neem Oil',
            }
        ]
    },
    {
        id: 3,
        name: 'Soil Amendment',
        subTypes: [
            {
                id: 1,
                name: 'Compost',
            },
            {
                id: 2,
                name: 'Sulphur',
            },
            {
                id: 3,
                name: 'Mulch',
            }
        ],
    },
    {
        id: 4,
        name: 'Action',
        subTypes: [
            {
                id: 1,
                name: 'Prune',
            }
        ],
    },
    {
        id: 5,
        name: 'Test',
        subTypes: [
            {
                id: 1,
                name: 'Soil pH',
            }
        ],
    }
];

export default {
    activityTypes
}
