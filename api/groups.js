// Groups API Handler
const GroupRepository = require('../database/groupRepository');
const GroupsService = require('../services/groupsService');

const groupsHandler = async (req, res) => {
  try {
    const repository = new GroupRepository();
    
    // 取得所有啟用的群組
    const enabledGroups = await repository.findEnabledGroups();
    
    res.status(200).json({
      groups: enabledGroups
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const groupDetailHandler = async (req, res) => {
  try {
    const repository = new GroupRepository();
    
    // 驗證群組 ID
    const validation = GroupsService.validateGroupId(req.params.id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // 取得群組詳細資訊
    const group = await repository.findById(validation.id);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const groupItemsHandler = async (req, res) => {
  try {
    const repository = new GroupRepository();
    
    // 驗證群組 ID
    const validation = GroupsService.validateGroupId(req.params.id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // 檢查群組是否存在
    const group = await repository.findById(validation.id);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // 取得群組事件並分類
    const groupedEvents = await repository.getGroupEventsByType(validation.id);

    res.status(200).json(groupedEvents);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  groupsHandler,
  groupDetailHandler,
  groupItemsHandler
};