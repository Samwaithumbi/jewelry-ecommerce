"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PhotoUploadProps {
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
}

export function PhotoUpload({ onPhotosChange, maxPhotos = 5 }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const newPhotos: string[] = []
    const remainingSlots = maxPhotos - photos.length

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image. Please upload only image files.`)
        continue
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`)
        continue
      }

      // Create preview URL
      const url = URL.createObjectURL(file)
      newPhotos.push(url)
    }

    if (newPhotos.length > 0) {
      const updatedPhotos = [...photos, ...newPhotos]
      setPhotos(updatedPhotos)
      onPhotosChange(updatedPhotos)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    setPhotos(updatedPhotos)
    onPhotosChange(updatedPhotos)
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
            dragActive
              ? "border-[#B88E2F] bg-[#B88E2F]/5"
              : "border-primary/20 hover:border-[#B88E2F]/50 bg-[#FCFBF9]"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium text-[#111827] mb-2">
            Drag & drop photos here
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            or click to browse (max 5 photos, 5MB each)
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onButtonClick}
            className="border-[#B88E2F] text-[#B88E2F] hover:bg-[#B88E2F]/10"
          >
            Select Photos
          </Button>
        </div>
      )}

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-primary/10">
                <img
                  src={photo}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 size-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          
          {/* Add More Button */}
          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={onButtonClick}
              className="aspect-square rounded-lg border-2 border-dashed border-primary/20 flex flex-col items-center justify-center hover:border-[#B88E2F]/50 hover:bg-[#B88E2F]/5 transition-all duration-200"
            >
              <ImageIcon className="size-6 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Add Photo</span>
            </button>
          )}
        </div>
      )}

      {/* Photo Count */}
      <p className="text-xs text-muted-foreground">
        {photos.length} of {maxPhotos} photos uploaded
      </p>
    </div>
  )
}
