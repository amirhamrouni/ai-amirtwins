const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  topic: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  image_url: { type: DataTypes.STRING },
  status: {
    type: DataTypes.ENUM('pending', 'published', 'failed'),
    defaultValue: 'pending',
  },
  scheduled_at: { type: DataTypes.DATE, allowNull: false },
  published_at: { type: DataTypes.DATE },
  facebook_post_id: { type: DataTypes.STRING },
  error_message: { type: DataTypes.TEXT },
});

module.exports = Post;
