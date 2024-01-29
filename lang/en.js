const MESSAGES = {
  AUTH: {
    ACCOUNT_DEACTIVATED:
      "Your account is deactivated. please contact to admin.",
    VERIFY_EMAIL: "You need to verify your email.",
    EMAIL_EXIST: "Your email is already registered.",
    EMAIL_AVAILABLE: "Email is available.",
    VALID_TOKEN: "Otp is valid.",
    INVALID_TOKEN: "Invalid Otp.",
    MOBILE_NO_EXIST: "Your mobile no is already registered.",
    USER_NAME_EXIST: "User name is already exist, please choose another.",
    EMAIL_REQUIRED: "Email field is required.",
    ANYONE_KEY_REQUIRED_FOR_LOGIN:
      "You need to sent at least one auth field (mob_no or email).",
    PASSWORD_RESET_EMAIL:
      "Please check your mail, we have sent reset password OTP on your mail id.",
    PASSWORD_DELETE_LINK:
      "Please check your mail, we have sent OTP on your mail id.",
    PASSWORD_RESET_DONE: "Password reset successfully",
    LOGIN_SUCCESS: "User log in successfully.",
    LOGOUT_SUCCESS: "User log out successfully.",
    PASSWORD_WRONG: "Your password is incorrect.",
    CURRENT_PASSWORD_WRONG: "Current password is incorrect.",
    PASSWORD_CHANGED: "Password changed successfully.",
    DEFINE_ROLES: "You need to define roles to create a user.",
    USER_CAN_REGISTER: "User can be register.",
    WRONG_USER:
      "The email you entered doesn't belong to an account. Please check your email and try again.",
    WRONG_RESET_TOKEN: "Invalid OTP",
    NOT_ALLOWED: "You are not allow to access this page",
  },
  CRUD: {
    CREATED: (module) => module + " created successfully.",
    EXIST: (module) => module + " already exist.",
    RETRIEVED: (module) => module + " retrieved successfully.",
    UPDATED: (module) => module + " updated successfully.",
    NOT_FOUND: (module) => module + " not found.",
    DELETED: (module) => module + " deleted successfully.",
  },
  THANKYOU: "Thank you for your interest, we will contact you soon",
  SOMETHING_WRONG: "Oops! something went wrong ,please try again later.",
  FOLLOWING_ACTION: "User has been successfully added",
  BLOCKING_ACTION: "User has been successfully blocked",
  UN_FOLLOWING_ACTION: "User has been successfully removed",
  UN_BLOCKING_ACTION: "User has been successfully unblocked",
  VALID_FILE: "Image file should be png, jpg, jpeg, tif",
};

module.exports = MESSAGES;
