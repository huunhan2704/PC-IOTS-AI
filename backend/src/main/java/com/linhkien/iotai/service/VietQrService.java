package com.linhkien.iotai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class VietQrService {

    @Value("${app.vietqr.bank-id:MB}")
    private String bankId;

    @Value("${app.vietqr.bank-name:MBBank - Ngan hang TMCP Quan doi}")
    private String bankName;

    @Value("${app.vietqr.account-no:0987654321}")
    private String accountNo;

    @Value("${app.vietqr.account-name:TRAN HUU NHAN}")
    private String accountName;

    @Value("${app.vietqr.template:compact2}")
    private String template;

    public String generateQrImageUrl(BigDecimal amount, String orderCode) {
        try {
            long amt = amount.longValue();
            String encodedAccountName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);
            String encodedContent = URLEncoder.encode(orderCode, StandardCharsets.UTF_8);

            return String.format(
                    "https://img.vietqr.io/image/%s-%s-%s.png?amount=%d&addInfo=%s&accountName=%s",
                    bankId, accountNo, template, amt, encodedContent, encodedAccountName
            );
        } catch (Exception e) {
            log.error("Error generating VietQR image URL", e);
            return "";
        }
    }

    public String generateEmvCoPayload(BigDecimal amount, String orderCode) {
        StringBuilder sb = new StringBuilder();

        // 00: Payload Format Indicator = "01"
        appendTlv(sb, "00", "01");

        // 01: Point of Initiation Method = "12" (Dynamic QR)
        appendTlv(sb, "01", "12");

        // 38: Merchant Account Information (Napas 247)
        StringBuilder napas = new StringBuilder();
        appendTlv(napas, "00", "A000000727"); // GUID Napas
        StringBuilder benInfo = new StringBuilder();
        appendTlv(benInfo, "00", bankId);
        appendTlv(benInfo, "01", accountNo);
        appendTlv(napas, "01", benInfo.toString());
        appendTlv(napas, "02", "QRIBFTTA");
        appendTlv(sb, "38", napas.toString());

        // 53: Transaction Currency = "704" (VND)
        appendTlv(sb, "53", "704");

        // 54: Transaction Amount
        appendTlv(sb, "54", String.valueOf(amount.longValue()));

        // 58: Country Code = "VN"
        appendTlv(sb, "58", "VN");

        // 62: Additional Data Field (Order Code reference)
        StringBuilder addData = new StringBuilder();
        appendTlv(addData, "08", orderCode);
        appendTlv(sb, "62", addData.toString());

        // 63: CRC16 calculation placeholder
        sb.append("6304");
        String crc = calculateCrc16(sb.toString());
        sb.append(crc);

        return sb.toString();
    }

    private void appendTlv(StringBuilder sb, String tag, String value) {
        sb.append(tag);
        sb.append(String.format("%02d", value.length()));
        sb.append(value);
    }

    private String calculateCrc16(String str) {
        int crc = 0xFFFF;
        int polynomial = 0x1021;
        byte[] bytes = str.getBytes(StandardCharsets.US_ASCII);

        for (byte b : bytes) {
            for (int i = 0; i < 8; i++) {
                boolean bit = ((b >> (7 - i) & 1) == 1);
                boolean c15 = ((crc >> 15 & 1) == 1);
                crc <<= 1;
                if (c15 ^ bit) crc ^= polynomial;
            }
        }
        crc &= 0xFFFF;
        return String.format("%04X", crc);
    }

    public String getBankId() { return bankId; }
    public String getBankName() { return bankName; }
    public String getAccountNo() { return accountNo; }
    public String getAccountName() { return accountName; }
}
