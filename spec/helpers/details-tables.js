// The [header, value] pairs of a table that has one row per field, each with
// a th and a td (the plant tabs)
export function fieldRows(wrapper) {
    return wrapper.findAll('tbody tr').map(row => [row.find('th').text(), row.find('td').text()]);
}
