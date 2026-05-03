const db = require('./db');

async function setupDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         INT           NOT NULL AUTO_INCREMENT,
      username   VARCHAR(50)   NOT NULL UNIQUE,
      email      VARCHAR(100)  NOT NULL UNIQUE,
      password   VARCHAR(255)  NOT NULL,
      balance    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      role       ENUM('user','admin') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_email (email),
      INDEX idx_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id         INT            NOT NULL AUTO_INCREMENT,
      user_id    INT            NOT NULL,
      amount     DECIMAL(10,2)  NOT NULL,
      type       ENUM('topup','purchase') NOT NULL DEFAULT 'topup',
      status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      slip_image VARCHAR(255)   NULL,
      note       VARCHAR(500)   NULL,
      created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('Database tables ready');
}

module.exports = setupDatabase;
