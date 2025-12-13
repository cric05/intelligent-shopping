'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Command to add the new 'name' column to the 'Users' table
    await queryInterface.addColumn('Users', 'name', {
      type: Sequelize.STRING,
      allowNull: false, // We will make the name required
      defaultValue: 'User' // A default value just in case
    });
  },

  async down (queryInterface, Sequelize) {
    // Command to remove the column if we ever need to undo the migration
    await queryInterface.removeColumn('Users', 'name');
  }
};