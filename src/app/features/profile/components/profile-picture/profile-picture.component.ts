// ===================================================================
// Profile Picture Component
// src/app/features/profile/components/profile-picture/profile-picture.component.ts
// ===================================================================

import { Component, inject, signal, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { ProfileService } from '../../services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface DialogData {
  currentPicture: string | null;
}

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './profile-picture.component.html',
  styleUrl: './profile-picture.component.scss'
})
export class ProfilePictureComponent implements OnInit {
  @ViewChild('imageCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('replaceInput') replaceInput!: ElementRef<HTMLInputElement>;

  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);

  // Signals
  currentImage = signal<string | null>(null);
  selectedAvatar = signal<number | null>(null);
  loading = signal(false);
  uploadProgress = signal(0);
  errorMessage = signal<string | null>(null);
  isDragging = signal(false);

  // Image editor state
  zoomLevel = signal(1);
  rotation = signal(0);
  imageX = signal(0);
  imageY = signal(0);
  isDraggingImage = signal(false);
  dragStartX = 0;
  dragStartY = 0;

  // Default avatars
  defaultAvatars = [
    { id: 1, icon: 'person', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 2, icon: 'face', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 3, icon: 'mood', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 4, icon: 'psychology', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 5, icon: 'sentiment_satisfied', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 6, icon: 'workspace_premium', background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
    { id: 7, icon: 'star', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 8, icon: 'favorite', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ProfilePictureComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit() {
    // Initialize with current picture if exists
    if (this.data.currentPicture) {
      // Show current picture
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file
      if (!this.validateFile(file)) {
        return;
      }

      // Read and display file
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentImage.set(e.target?.result as string);
        this.errorMessage.set(null);
        this.selectedAvatar.set(null);

        // Initialize canvas after image loads
        setTimeout(() => this.initializeCanvas(), 100);
      };
      reader.readAsDataURL(file);
    }
  }

  validateFile(file: File): boolean {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage.set('نوع الملف غير مدعوم. الرجاء اختيار صورة JPG, PNG أو WebP');
      return false;
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.errorMessage.set('حجم الملف كبير جداً. الحد الأقصى 5MB');
      return false;
    }

    return true;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      const file = files[0];
      if (this.validateFile(file)) {
        // Process file
        const reader = new FileReader();
        reader.onload = (e) => {
          this.currentImage.set(e.target?.result as string);
          this.errorMessage.set(null);
          setTimeout(() => this.initializeCanvas(), 100);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  initializeCanvas() {
    if (!this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      this.drawImage(ctx, img);
    };
    img.src = this.currentImage()!;
  }

  drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((this.rotation() * Math.PI) / 180);
    ctx.scale(this.zoomLevel(), this.zoomLevel());
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const x = this.imageX() + (canvas.width - img.width) / 2;
    const y = this.imageY() + (canvas.height - img.height) / 2;

    ctx.drawImage(img, x, y);
    ctx.restore();
  }

  setZoom(event: any) {
    this.zoomLevel.set(event.value);
    this.initializeCanvas();
  }

  rotate(degrees: number) {
    this.rotation.update(r => r + degrees);
    this.initializeCanvas();
  }

  flipHorizontal() {
    // Implementation for horizontal flip
    this.initializeCanvas();
  }

  startDrag(event: MouseEvent) {
    this.isDraggingImage.set(true);
    this.dragStartX = event.clientX - this.imageX();
    this.dragStartY = event.clientY - this.imageY();
  }

  drag(event: MouseEvent) {
    if (this.isDraggingImage()) {
      this.imageX.set(event.clientX - this.dragStartX);
      this.imageY.set(event.clientY - this.dragStartY);
      this.initializeCanvas();
    }
  }

  endDrag() {
    this.isDraggingImage.set(false);
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(1, Math.min(3, this.zoomLevel() + delta));
    this.zoomLevel.set(newZoom);
    this.initializeCanvas();
  }

  selectAvatar(avatar: any) {
    this.selectedAvatar.set(avatar.id);
    this.currentImage.set(null);
    this.errorMessage.set(null);
  }

  removePicture() {
    this.loading.set(true);
    this.profileService.removeProfilePicture().subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.errorMessage.set('حدث خطأ في إزالة الصورة');
        this.loading.set(false);
      }
    });
  }

  save() {
    if (!this.currentImage() && !this.selectedAvatar()) {
      return;
    }

    this.loading.set(true);
    this.uploadProgress.set(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      this.uploadProgress.update(p => Math.min(p + 10, 90));
    }, 200);

    if (this.currentImage()) {
      // Get cropped image from canvas
      const canvas = this.canvasRef?.nativeElement;
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = (e.target?.result as string).split(',')[1];

              this.profileService.updateProfilePicture({
                imageData: base64,
                mimeType: 'image/png'
              }).subscribe({
                next: () => {
                  clearInterval(progressInterval);
                  this.uploadProgress.set(100);
                  setTimeout(() => {
                    this.dialogRef.close(true);
                  }, 500);
                },
                error: () => {
                  clearInterval(progressInterval);
                  this.errorMessage.set('حدث خطأ في رفع الصورة');
                  this.loading.set(false);
                  this.uploadProgress.set(0);
                }
              });
            };
            reader.readAsDataURL(blob);
          }
        }, 'image/png');
      }
    } else if (this.selectedAvatar()) {
      // Handle avatar selection
      clearInterval(progressInterval);
      this.uploadProgress.set(100);
      setTimeout(() => {
        this.dialogRef.close({ avatar: this.selectedAvatar() });
      }, 500);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
