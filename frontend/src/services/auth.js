import api from "./axios";

export const signupUser = async (formData) => {
  const response = await api.post("/auth/signup", {
    name: formData.name,
    email: formData.email,
    password: formData.password,
  });
  return response.data;
};

export const loginUser = async (formData) => {
  const response = await api.post("/auth/login", {
    email: formData.email,
    password: formData.password,
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async ({ token, newPassword }) => {
  const response = await api.post(
    "/auth/reset-password",
    {
      token,
      new_password: newPassword,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

export const createWorkspace = async (name) => {
  const response = await api.post("/workspaces/", { name });
  return response.data;
};

export const getWorkspaces = async () => {
  const response = await api.get("/workspaces/");
  return response.data;
};

// Fetch documents in a workspace
export const getDocuments = async (workspaceId) => {
  const response = await api.get(`/documents/workspace/${workspaceId}`);
  return response.data;
};

// Create a new document in a workspace
export const createDocument = async (workspaceId, title, content) => {
  const response = await api.post(`/documents/workspace/${workspaceId}`, {
    title,
    content,
  });
  return response.data;
};

export const updateDocument = async (documentId, content) => {
  const response = await api.put(`/documents/${documentId}`, {
    content,
  });
  return response.data;
};
export const updateTitle = async (documentId, title) => {
  const response = await api.put(`/documents/${documentId}`, {
    title,
  });
  return response.data;
};

// Get single document detail
export const getDocument = async (documentId) => {
  const response = await api.get(`/documents/${documentId}`);
  return response.data;
};

// Delete a document
export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};
