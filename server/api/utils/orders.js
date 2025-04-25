const orders = [
    {
        id: "100",
        status: "delivered",
        address: "12 Swanston St, Melbourne VIC",
        delivered_date: "2025-04-01 09:15",
        arrival_date: "2025-04-01 09:15",
        attemp: 1,
        name: "Liam Thompson",
    },
    {
        id: "101",
        status: "on progress",
        address: "50 Bourke St, Melbourne VIC",
        delivered_date: "2025-04-03 14:30",
        arrival_date: "2025-04-03 14:30",
        attemp: 1,
        name: "Olivia Smith",
    },
    {
        id: "102",
        status: "on the way",
        address: "88 Collins St, Melbourne VIC",
        delivered_date: "2025-04-06 11:05",
        arrival_date: "2025-04-06 11:05",
        attemp: 1,
        name: "Jack Williams",
    },
    {
        id: "103",
        status: "delivered",
        address: "101 Lonsdale St, Melbourne VIC",
        delivered_date: "2025-04-08 16:45",
        arrival_date: "2025-04-08 16:45",
        attemp: 1,
        name: "Emily Johnson",
    },
    {
        id: "104",
        status: "on the way",
        address: "19 Queen St, Melbourne VIC",
        delivered_date: "2025-04-11 10:20",
        arrival_date: "2025-04-11 10:20",
        attemp: 1,
        name: "Noah Brown",
    },
    {
        id: "105",
        status: "delivered",
        address: "22 Elizabeth St, Melbourne VIC",
        delivered_date: "2025-04-14 15:10",
        arrival_date: "2025-04-14 15:10",
        attemp: 1,
        name: "Ava Jones",
    },
    {
        id: "106",
        status: "on progress",
        address: "65 Flinders Ln, Melbourne VIC",
        delivered_date: "2025-04-17 12:30",
        arrival_date: "2025-04-17 12:30",
        attemp: 1,
        name: "Charlie Taylor",
    },
    {
        id: "107",
        status: "delivered",
        address: "77 Spencer St, Melbourne VIC",
        delivered_date: "2025-04-20 13:25",
        arrival_date: "2025-04-20 13:25",
        attemp: 1,
        name: "Sophie Harris",
    },
    {
        id: "108",
        status: "on the way",
        address: "5 La Trobe St, Melbourne VIC",
        delivered_date: "2025-04-24 10:55",
        arrival_date: "2025-04-24 10:55",
        attemp: 1,
        name: "Thomas White",
    },
    {
        id: "109",
        status: "on progress",
        address: "33 Exhibition St, Melbourne VIC",
        delivered_date: "2025-04-28 17:40",
        arrival_date: "2025-04-28 17:40",
        attemp: 1,
        name: "Isla Martin",
    }
];


const getOrder = (id) => {
    return orders.find(o => o.id == id) || null;
}

const getOrders = () => {
    return orders;
}

module.exports = { getOrder, getOrders }