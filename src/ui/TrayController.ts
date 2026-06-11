import { app, Tray, Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron';
import * as path from 'path';

export class TrayController {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private statusIconPath: string;

  constructor(mainWindow: BrowserWindow | null) {
    this.mainWindow = mainWindow;
    this.statusIconPath = path.join(__dirname, '../assets/status-icon.png');
    this.createTray();
  }

  private createTray(): void {
    // Create tray icon
    this.tray = new Tray(this.statusIconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Jarvis Assistant',
        enabled: false
      },
      {
        type: 'separator'
      },
      {
        label: 'Show Window',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
          }
        }
      },
      {
        label: 'Hide Window',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.hide();
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Exit',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    
    // Set tooltip
    this.tray.setToolTip('Jarvis Desktop Assistant');
    
    // Handle tray icon click to show window
    this.tray.on('click', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isVisible()) {
          this.mainWindow.hide();
        } else {
          this.mainWindow.show();
        }
      }
    });
  }

  public updateStatus(status: string): void {
    if (this.tray) {
      // Update tray icon based on status
      const iconPath = this.getStatusIconPath(status);
      this.tray.setImage(iconPath);
    }
  }

  private getStatusIconPath(status: string): string {
    switch (status.toLowerCase()) {
      case 'listening':
        return path.join(__dirname, '../assets/listening-icon.png');
      case 'processing':
        return path.join(__dirname, '../assets/processing-icon.png');
      case 'idle':
      default:
        return this.statusIconPath;
    }
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}