import { Component, inject, signal, OnDestroy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-employee',
  imports: [FormsModule, ZXingScannerModule],
  templateUrl: './employee.html',
  styleUrl: './employee.css'
})
export class Employee implements OnDestroy {

  private readonly ticketService = inject(TicketService);

  readonly code = signal('');
  readonly validating = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  // scannerEnabled se activa una sola vez.
  // Después no lo apagamos para evitar reiniciar la webcam.
  readonly scannerEnabled = signal(false);
  readonly scannerVisible = signal(false);
  readonly scanLocked = signal(true);

  readonly cameras = signal<MediaDeviceInfo[]>([]);
  readonly selectedCamera = signal<MediaDeviceInfo | undefined>(undefined);
  readonly hasPermission = signal<boolean | null>(null);

  async validateTicket() {
    this.successMessage.set('');
    this.errorMessage.set('');

    const ticketCode = this.code().trim();

    if (!ticketCode) {
      this.errorMessage.set('Ingresá o escaneá el código de la entrada.');
      return;
    }

    this.validating.set(true);

    const { data, error } = await this.ticketService.validateTicket(ticketCode);

    this.validating.set(false);

    if (error) {
      console.error('Error validando ticket:', error);
      this.errorMessage.set(error.message);
      return;
    }

    this.successMessage.set('Entrada válida. Ingreso autorizado.');
    this.code.set('');

    console.log('TICKET VALIDADO:', data);
  }

  async validateCandy() {
    this.successMessage.set('');
    this.errorMessage.set('');

    const ticketCode = this.code().trim();
    if(!ticketCode){
      this.errorMessage.set('Ingresá o escaneá el código de la entrada.');
      return;
    }

    this.validating.set(true);
    const { data,error } = await this.ticketService.validateCandy(ticketCode);
    this.validating.set(false);

    if(error){
      console.error('Error validando Candy:',error);
      this.errorMessage.set(error.message);
      return;
    }

    this.successMessage.set(data?.message ?? 'Candy entregado correctamente.');
    this.code.set('');
  }

  onCamerasFound(devices: MediaDeviceInfo[]) {
    this.cameras.set(devices);

    devices.forEach((device, index) => {console.log(index, device.label, device.deviceId);});

    const camera =
      devices.find(device => device.label.includes('HD Web Camera')) ??
      devices.find(device => !device.label.toLowerCase().includes('obs')) ??
      devices[0];

    this.selectedCamera.set(camera);

    console.log('CAMARA SELECCIONADA:', camera?.label);
  }

  onPermissionResponse(permission: boolean) {
    console.log('PERMISO CAMARA:', permission);
    this.hasPermission.set(permission);
  }

  onCodeScanned(result: string) {
    if (this.scanLocked()) return;

    const scannedCode = result.trim();

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(scannedCode)) {
      console.log('Código detectado pero no es un UUID:', scannedCode);
      return;
    }

    this.scanLocked.set(true);
    this.code.set(scannedCode);
    this.scannerVisible.set(false);

    this.successMessage.set('');
    this.errorMessage.set('');

    console.log('QR LEIDO:', scannedCode);
  }

  onScanError(error: unknown) {
    console.error('ERROR SCANNER:', error);
  }

  scanQr() {
    this.successMessage.set('');
    this.errorMessage.set('');

    /*
      Solo la primera vez iniciamos realmente ZXing.
      Después permanece activo.
    */
    if (!this.scannerEnabled()) {
      this.scannerEnabled.set(true);
    }

    this.scanLocked.set(false);
    this.scannerVisible.set(true);
  }

  hideScanner() {
    /*
      No apagamos scannerEnabled.
      Solo ocultamos la imagen y bloqueamos lecturas.
    */
    this.scanLocked.set(true);
    this.scannerVisible.set(false);
  }

  ngOnDestroy() {
    this.scannerEnabled.set(false);
  }
}