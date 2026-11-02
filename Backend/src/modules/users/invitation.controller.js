class InvitationController {
  async get(req, res, next) {
    try {
      const err = new Error('Invitations not implemented yet');
      err.statusCode = 501;
      err.code = 'NOT_IMPLEMENTED';
      throw err;
    } catch (error) {
      next(error);
    }
  }

  async accept(req, res, next) {
    try {
      const err = new Error('Invitations not implemented yet');
      err.statusCode = 501;
      err.code = 'NOT_IMPLEMENTED';
      throw err;
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const err = new Error('Invitations not implemented yet');
      err.statusCode = 501;
      err.code = 'NOT_IMPLEMENTED';
      throw err;
    } catch (error) {
      next(error);
    }
  }
}

export default InvitationController;

