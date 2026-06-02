import { upload } from "./client";

export const uploadApi = {
  document: (file: File, source = "管理员上传", tags = "") => {
    const form = new FormData();
    form.append("file", file);
    form.append("source", source);
    form.append("tags", tags);
    return upload<Record<string, unknown>>("/api/knowledge/documents", form);
  },
};
