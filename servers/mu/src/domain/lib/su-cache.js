const setSchedulerOwnerQuery = (processId, owner) => ({
  sql: `
      INSERT INTO scheduler_owner(process_id, owner) VALUES(?, ?)
      ON CONFLICT (process_id) DO NOTHING;
  `,
  parameters: [processId, owner]
})

export function setSchedulerOwner (db, processId, owner) {
  const result = db.run(setSchedulerOwnerQuery(processId, owner))
  console.log(result)
}

const getSchedulerOwnerQuery = (processId) => ({
  sql: `
      SELECT owner 
      FROM scheduler_owner
      WHERE process_id = ?;
  `,
  parameters: [processId]
})

export function getSchedulerOwner (db, processId) {
  const result = db.get(getSchedulerOwnerQuery(processId))
  console.log(result)
  return result?.owner
}
