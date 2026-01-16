import { onRequestDelete as __api_storage_delete_ts_onRequestDelete } from "C:\\myjoe\\functions\\api\\storage\\delete.ts"
import { onRequestGet as __api_storage_download_ts_onRequestGet } from "C:\\myjoe\\functions\\api\\storage\\download.ts"
import { onRequestPost as __api_storage_signed_url_ts_onRequestPost } from "C:\\myjoe\\functions\\api\\storage\\signed-url.ts"
import { onRequestPost as __api_storage_upload_ts_onRequestPost } from "C:\\myjoe\\functions\\api\\storage\\upload.ts"
import { onRequestPost as __api_upload_feedback_ts_onRequestPost } from "C:\\myjoe\\functions\\api\\upload-feedback.ts"
import { onRequestPut as __api_upload_feedback_ts_onRequestPut } from "C:\\myjoe\\functions\\api\\upload-feedback.ts"
import { onRequestGet as __api_view_feedback_image_ts_onRequestGet } from "C:\\myjoe\\functions\\api\\view-feedback-image.ts"

export const routes = [
    {
      routePath: "/api/storage/delete",
      mountPath: "/api/storage",
      method: "DELETE",
      middlewares: [],
      modules: [__api_storage_delete_ts_onRequestDelete],
    },
  {
      routePath: "/api/storage/download",
      mountPath: "/api/storage",
      method: "GET",
      middlewares: [],
      modules: [__api_storage_download_ts_onRequestGet],
    },
  {
      routePath: "/api/storage/signed-url",
      mountPath: "/api/storage",
      method: "POST",
      middlewares: [],
      modules: [__api_storage_signed_url_ts_onRequestPost],
    },
  {
      routePath: "/api/storage/upload",
      mountPath: "/api/storage",
      method: "POST",
      middlewares: [],
      modules: [__api_storage_upload_ts_onRequestPost],
    },
  {
      routePath: "/api/upload-feedback",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_feedback_ts_onRequestPost],
    },
  {
      routePath: "/api/upload-feedback",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_upload_feedback_ts_onRequestPut],
    },
  {
      routePath: "/api/view-feedback-image",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_view_feedback_image_ts_onRequestGet],
    },
  ]