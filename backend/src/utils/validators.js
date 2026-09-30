// Phone Number Validation (Bangladeshi 11 digit format check)

export const validatePhone = (phone) => {

    if (!phone) return "Phone number is required";

    const phoneRegex = /^01[3-9]\d{8}$/;

    if (!phoneRegex.test(phone)) {
        return "Invalid phone number! Must be 11 digits starting with 01";
    }

    return null; // Valid
};


// Required Text/Input Check

export const validateRequired = (text, fieldName = "This field") => {

    if (!text || text.trim() === "") {
        return `${fieldName} cannot be empty`;
    }

    return null; // Valid
};