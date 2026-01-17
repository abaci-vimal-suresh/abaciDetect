import { useContext, useCallback } from 'react';
// import AuthContext from '../contexts/authContext';

const useErrorHandler = () => {
  // const { setLogOut } = useContext(AuthContext);

const handleError = useCallback((error: any): string => {
  let errorMsg = '';

  if (error?.response?.status === 400||error?.response?.status === 500) {
    const errors = error.response.data?.errors;
    const message = error.response.data?.message;

    // Start with the main message if present
    if (message) {
      errorMsg += message;
    }

    // Handle errors array or object
    if (errors) {
      // If errors is an array of strings
      if (Array.isArray(errors) && errors.length > 0) {
        const errorsList = errors.join('\n');
        errorMsg += errorMsg ? '\n' + errorsList : errorsList;
      } 
      // If errors is an object with field-level errors
      else if (typeof errors === 'object' && Object.keys(errors).length > 0) {
        const messages = Object.entries(errors).map(([key, messagesArray]) => {
          let errorField = key.replace(/_/g, ' ');
          errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
          //@ts-ignore
          return `${errorField} - ${messagesArray.join(', ')}`;
        });
        const formattedErrors = messages.join('\n');
        errorMsg += errorMsg ? '\n' + formattedErrors : formattedErrors;
      }
    }

    // Fallback if no message or errors were found
    if (!errorMsg) {
      errorMsg = 'Bad request.';
    }

  } else if (error?.response?.status === 406) {
    errorMsg += error.response.data.message;

  } else if (error?.response?.status === 409) {
    errorMsg += typeof error.response.data === 'string'
      ? error.response.data
      : JSON.stringify(error.response.data);

  } else if (error?.response?.status === 405) {
    errorMsg += error.response.data?.errors?.detail || 'Method not allowed.';

  } else if (error?.response?.status === 404) {
    if (error.response.data?.errors?.detail) {
      errorMsg += error.response.data.errors.detail;
    } else {
      errorMsg += error.response.data.message || 'Resource not found.';
    }

  } else if (error?.response?.data?.errors) {
    errorMsg += JSON.stringify(error.response.data.errors);

  } else if (error.message) {
    errorMsg += error.message;

  } else {
    errorMsg += 'Something went wrong. Please check your connection and try again!';
  }

  return errorMsg;
}, []);


  return { handleError };
};

export default useErrorHandler;
