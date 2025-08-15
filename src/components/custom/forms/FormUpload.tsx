import * as React from "react";
import {Button} from "@/components/ui/button";
import {formatBytes, useFileUpload} from "@/hooks/use-file-upload.js";
import {
  AlertCircleIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileIcon, FileSpreadsheetIcon,
  FileTextIcon, HeadphonesIcon, ImageIcon,
  Trash2Icon,
  UploadCloudIcon,
  UploadIcon, VideoIcon
} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.js";
import {useEffect, useState} from "react";
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {FormUploadProps} from "@/types/form";

const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  if (
    fileType.includes("pdf") ||
    fileName.endsWith(".pdf") ||
    fileType.includes("word") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return <FileTextIcon className="size-4 opacity-60"/>
  } else if (
    fileType.includes("zip") ||
    fileType.includes("archive") ||
    fileName.endsWith(".zip") ||
    fileName.endsWith(".rar")
  ) {
    return <FileArchiveIcon className="size-4 opacity-60"/>
  } else if (
    fileType.includes("excel") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx")
  ) {
    return <FileSpreadsheetIcon className="size-4 opacity-60"/>
  } else if (fileType.includes("video/")) {
    return <VideoIcon className="size-4 opacity-60"/>
  } else if (fileType.includes("audio/")) {
    return <HeadphonesIcon className="size-4 opacity-60"/>
  } else if (fileType.startsWith("image/")) {
    return <ImageIcon className="size-4 opacity-60"/>
  }
  return <FileIcon className="size-4 opacity-60"/>
}

type Props = {
  maxFiles?: number,
  maxSize?: number,
  onFileChanged?: (data: Record<any, any>[]) => void
  clearFileList?: boolean
}

const ContainerUpload = ({form, item, ...props}: FormUploadProps) => {
  const [
    {files, isDragging, errors},
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: true,
    maxFiles: item.maxFiles,
    maxSize: item.maxSize,
  })

  useEffect(() => {
    const data = files.map((f) => ({
      id: f.id,
      name: f.file.name,
      file: f,
    }));
    form.setValue(item.name, data);
  }, [files]);


  const FileRow = ({file, removeFile}: any) => {
    return (
      <TableRow key={file.id}>
        <TableCell className="max-w-48 py-2 font-medium">
                      <span className="flex items-center gap-2">
                        <span className="shrink-0">{getFileIcon(file)}</span>{" "}
                        <div className={"flex flex-col gap-0 truncate"}>
                          <span className="truncate">{file.file.name}</span>
                        </div>
                      </span>
        </TableCell>
        <TableCell className="text-muted-foreground py-2">
          <div
            className="truncate sm:max-w-[100px] max-w-[50px]">{file.file.type.split("/")[1]?.toUpperCase() || "UNKNOWN"}</div>
        </TableCell>
        <TableCell className="text-muted-foreground py-2">
          {formatBytes(file.file.size)}
        </TableCell>
        <TableCell className="py-2 text-right whitespace-nowrap">
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground/80 hover:text-foreground size-8 hover:bg-transparent"
            aria-label={`Download ${file.file.name}`}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              window.open(file.preview, "_blank");
            }}
          >
            <DownloadIcon className="size-4"/>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground/80 hover:text-foreground size-8 hover:bg-transparent"
            aria-label={`Remove ${file.file.name}`}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              removeFile(file.id)
            }}
          >
            <Trash2Icon className="size-4"/>
          </Button>
        </TableCell>
      </TableRow>
    )
  }
  return (
    <FormField
      control={form.control}
      name={item.name}
      render={({field}) => (
        <FormItem>
          <FormLabel>{item.label}</FormLabel>
          <FormControl>

            <div className="flex flex-col gap-2">
              {/* Drop area */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                data-dragging={isDragging || undefined}
                data-files={files.length > 0 || undefined}
                className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-40 flex-col items-center rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px] data-[files]:hidden bg-secondary"
              >
                <input
                  {...getInputProps()}
                  className="sr-only"
                  aria-label="Upload files"
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    <FileIcon className="size-4 opacity-60"/>
                  </div>
                  <p className="mb-1.5 text-sm font-medium">Drag and drop or click to Upload files</p>
                  <p className="text-muted-foreground text-xs">
                    Max {item.maxFiles} files ∙ Up to {formatBytes(item.maxSize)}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                    event.preventDefault();
                    openFileDialog();
                  }}>
                    <UploadIcon className="-ms-1 opacity-60" aria-hidden="true"/>
                    Select files
                  </Button>
                </div>
              </div>
              {files.length > 0 && (
                <>
                  {/* Table with files */}
                  <div className="flex items-center justify-between gap-2 px-2 pt-2">
                    <h3 className="text-sm font-medium">Files ({files.length})</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                        event.preventDefault();
                        openFileDialog();
                      }}>
                        <UploadCloudIcon
                          className="-ms-0.5 size-3.5 opacity-60"
                          aria-hidden="true"
                        />
                        Add files
                      </Button>
                      <Button variant="outline" size="sm" onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                        event.preventDefault();
                        clearFiles()
                      }}>
                        <Trash2Icon
                          className="-ms-0.5 size-3.5 opacity-60"
                          aria-hidden="true"
                        />
                        Remove all
                      </Button>
                    </div>
                  </div>
                  <div className="bg-background overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader className="text-xs">
                        <TableRow className="bg-muted/50">
                          <TableHead className="h-9 py-2">Name</TableHead>
                          <TableHead className="h-9 py-2">Type</TableHead>
                          <TableHead className="h-9 py-2">Size</TableHead>
                          <TableHead className="h-9 w-0 py-2 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-[13px]">
                        {files.map((file) => <FileRow key={file.id} file={file} removeFile={removeFile}/>)}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {errors.length > 0 && (
                <div
                  className="text-destructive flex items-center gap-1 text-xs"
                  role="alert"
                >
                  <AlertCircleIcon className="size-3 shrink-0"/>
                  <span>{errors[0]}</span>
                </div>
              )}
            </div>
          </FormControl>
          {item?.description && <FormDescription>{item.description}</FormDescription>}
          <FormMessage/>
        </FormItem>
      )}
    />
  )
}
export default ContainerUpload