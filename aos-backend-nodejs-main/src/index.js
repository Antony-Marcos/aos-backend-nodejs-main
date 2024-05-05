const express = require("express");
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});

const app = express();

const PORT = 4000; 

app.use(express.json());

app.get('/', (req, res) => {
    console.log('Olá mundo');
});

app.get('/participants', async (req, res) => {
    try {
        const participants = await pool.query('SELECT * FROM Participants');
        return res.status(200).json(participants.rows);
    } catch (err) {
        return res.status(400).send(err);
    }
});

app.delete('/participants/:id', async (req, res) => {
  const { id } = req.params;
  try {
     
      await pool.query('DELETE FROM ParticipantsGroups WHERE participant_id = $1', [id]);

      const deletedParticipant = await pool.query('DELETE FROM Participants WHERE id = $1 RETURNING *', [id]);
      if (deletedParticipant.rows.length === 0) {
          return res.status(404).send('Registro não encontrado');
      } else {
          return res.status(200).send('Registro removido com sucesso');
      }
  } catch (err) {
      return res.status(400).send(err);
  }
});


app.post('/participants', async (req, res) => {
    const { name, age, profession, groupId } = req.body;
    try {
        let participant = await pool.query('SELECT * FROM Participants WHERE name = $1 AND age = $2 AND profession = $3', [name, age, profession]);
        if (participant.rows.length === 0) {
            participant = await pool.query('INSERT INTO Participants (name, age, profession) VALUES ($1, $2, $3) RETURNING id, name, age, profession', [name, age, profession]);
            const participantId = participant.rows[0].id;
            await pool.query('INSERT INTO Group_Participants (group_id, participant_id) VALUES ($1, $2)', [groupId, participantId]);
            return res.status(200).send(participant.rows[0]);
        } else {
            return res.status(200).send(participant.rows[0]);
        }
    } catch (err) {
        return res.status(400).send(err);
    }
});

app.put('/participants/:id', async (req, res) => {
    const { id } = req.params;
    const { groupId } = req.body;
    try {
        const updatedParticipant = await pool.query('UPDATE Group_Participants SET group_id = $1 WHERE participant_id = $2 RETURNING *', [groupId, id]);
        if (updatedParticipant.rows.length === 0) {
            return res.status(404).send('Registro não encontrado');
        } else {
            return res.status(200).send('Participante atualizado com sucesso no grupo');
        }
    } catch (err) {
        return res.status(400).send(err);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
