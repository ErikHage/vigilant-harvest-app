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
                name: 'Compost',
            },
            {
                id: 6,
                name: 'Water Soluble All Purpose',
            },
            {
                id: 7,
                name: 'Granular Slow Release',
            },
            {
                id: 8,
                name: 'Calcium/Magnesium Supplement',
            }
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
];

export default {
    activityTypes
}
