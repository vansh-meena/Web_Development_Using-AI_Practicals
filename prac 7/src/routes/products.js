const express = require('express');
const router = express.Router();
const {
  list,
  getOne,
  create,
  replace,
  update,
  remove,
} = require('../controllers/products');

router.route('/').get(list).post(create);
router
  .route('/:id')
  .get(getOne)
  .put(replace)
  .patch(update)
  .delete(remove);

module.exports = router;
