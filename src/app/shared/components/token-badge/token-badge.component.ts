import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-token-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: "./token-badge.component.html",
  styleUrl: "./token-badge.component.scss",
})
export class TokenBadgeComponent {
  @Input() tokenNumber?: number;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showIcon: boolean = true;
  @Input() tooltipText: string = 'رقم الرمز في قائمة الانتظار';
}
