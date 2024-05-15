const Route = require('../Route');
const ValidationError = require('../../classes/ValidationError');
const SQLError = require('../../classes/SQLError');
const db = require('../../database');

// funciones
const existsTask = require('../put/functions/editTask/existsTask');
const removeTaskData = require('./functions/deleteTask/removeTaskData');

const route = new Route('/delete-task', async (req, res) => {
  try {
    const taskId = Number(req.query.task_id);
    if(isNaN(taskId)){
      throw new ValidationError('El ID de la tarea debe ser un número');
    }
    if(!await existsTask(taskId)){
      throw new ValidationError(`La tarea con ID '${taskId}' no existe`);
    }
    await db.commit();
    db.serialize(async () => {
      try {
        const queries = db.read('delete', 'task_info').split(";");
        await db.begin();

        for(const query of queries){
          await removeTaskData(taskId, query);
        }
        await db.commit();
        res.status(200).json({ message: `La tarea con ID '${taskId}' ha sido eliminada correctamente.` });
      } catch(err){
        await db.rollback();
        if(err instanceof SQLError){
          return res.status(500).json({ error: err.message });
        }
        console.log(err);
        res.status(500).json({ message: `Hubo un error al intentar eliminar la tarea. Error interno` });
      }
    });
  } catch(err){
    if(err instanceof ValidationError){
      return res.status(400).json({error: err.message});
    }
    console.log(err);
    res.status(500).json({ message: `Hubo un error al intentar eliminar la tarea. Error interno` });
  }
});

module.exports = route;