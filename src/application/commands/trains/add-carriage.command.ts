export interface AddCarriageCommand {
  trainId: string;
  number: number;
  type: 'platskart' | 'coupe' | 'sv';
  seatCount: number;
}
