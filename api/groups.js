// Groups API Handler
const GroupRepository = require('../database/groupRepository');
const GroupsService = require('../services/groupsService');

// 驗證群組資料
const validateGroupData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('name is required');
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
      errors.push('description is required');
    }
  }

  return errors;
};

// GET /api/groups - 取得群組列表
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

// GET /api/groups/:id - 取得單一群組
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

// GET /api/groups/:id/items - 取得群組事件
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

// POST /api/groups - 建立新群組
const createGroup = async (req, res) => {
  try {
    const repository = new GroupRepository();

    // 驗證資料
    const errors = validateGroupData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed: ' + errors.join(', ')
      });
    }

    // 設定預設值
    const groupData = {
      ...req.body,
      enabled: req.body.enabled !== undefined ? req.body.enabled : true
    };

    // 建立群組
    const newGroup = await repository.create(groupData);

    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// PUT /api/groups/:id - 更新群組
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const repository = new GroupRepository();

    // 驗證群組 ID
    const validation = GroupsService.validateGroupId(id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // 檢查群組是否存在
    const existingGroup = await repository.findById(validation.id);
    if (!existingGroup) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // 驗證更新資料
    const errors = validateGroupData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed: ' + errors.join(', ')
      });
    }

    // 更新群組
    const updatedGroup = await repository.update(validation.id, req.body);

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// DELETE /api/groups/:id - 刪除群組
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const repository = new GroupRepository();

    // 驗證群組 ID
    const validation = GroupsService.validateGroupId(id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // 檢查群組是否存在
    const existingGroup = await repository.findById(validation.id);
    if (!existingGroup) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // 刪除群組
    const success = await repository.delete(validation.id);
    if (!success) {
      return res.status(500).json({
        error: 'Failed to delete group'
      });
    }

    res.status(200).json({
      message: 'Group deleted successfully',
      id: validation.id
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// POST /api/groups/:id/items - 添加事件到群組
const addGroupItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_id } = req.body;
    const repository = new GroupRepository();

    // 驗證群組 ID
    const validation = GroupsService.validateGroupId(id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // 驗證 event_id
    if (!event_id || isNaN(parseInt(event_id))) {
      return res.status(400).json({
        error: 'event_id is required and must be a number'
      });
    }

    // 檢查群組是否存在
    const existingGroup = await repository.findById(validation.id);
    if (!existingGroup) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // 添加事件到群組
    const success = await repository.addEventToGroup(validation.id, parseInt(event_id));
    if (!success) {
      return res.status(400).json({
        error: 'Failed to add event to group. Event may not exist.'
      });
    }

    res.status(201).json({
      message: 'Event added to group successfully',
      group_id: validation.id,
      event_id: parseInt(event_id)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// DELETE /api/groups/:id/items/:eventId - 從群組移除事件
const removeGroupItem = async (req, res) => {
  try {
    const { id, eventId } = req.params;
    const repository = new GroupRepository();

    // 驗證群組 ID
    const validation = GroupsService.validateGroupId(id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // 驗證事件 ID
    if (!eventId || isNaN(parseInt(eventId))) {
      return res.status(400).json({
        error: 'eventId is required and must be a number'
      });
    }

    // 檢查群組是否存在
    const existingGroup = await repository.findById(validation.id);
    if (!existingGroup) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // 從群組移除事件
    const success = await repository.removeEventFromGroup(validation.id, parseInt(eventId));
    if (!success) {
      return res.status(404).json({
        error: 'Event not found in group'
      });
    }

    res.status(200).json({
      message: 'Event removed from group successfully',
      group_id: validation.id,
      event_id: parseInt(eventId)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  groupsHandler,
  groupDetailHandler,
  groupItemsHandler,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupItem,
  removeGroupItem
};