'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */
    // Command to remove the first column
    await queryInterface.removeColumn('Users', 'resetPasswordToken');
    // Command to remove the second column
    await queryInterface.removeColumn('Users', 'resetPasswordExpire');
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    // Command to add the first column back if we undo
    await queryInterface.addColumn('Users', 'resetPasswordToken', {
      type: Sequelize.STRING
    });
    // Command to add the second column back if we undo
    await queryInterface.addColumn('Users', 'resetPasswordExpire', {
      type: Sequelize.DATE
    });
  }
};