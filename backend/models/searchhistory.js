'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SearchHistory extends Model {
    static associate(models) {
      // This defines the relationship: a SearchHistory belongs to a User
      SearchHistory.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  SearchHistory.init({
    query: DataTypes.STRING,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SearchHistory',
  });
  return SearchHistory;
};