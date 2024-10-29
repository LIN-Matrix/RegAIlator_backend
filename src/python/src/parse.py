import fitz
from pdf2image import convert_from_path
import pytesseract

def extract_text_from_pdf(pdf_path):
    text = ''
    text_by_page = []
    # Open the PDF file as a document and extract text from each page
    with fitz.open(pdf_path) as doc:
        for page in doc:
            temp = page.get_text()
            # 去除空行和连续的空格
            temp = '\n'.join([line.strip() for line in temp.split('\n') if line.strip() != ''])
            text += temp
            text_by_page += [temp]

    if text == '':
        try:
            # If the text is empty, use OCR to extract text from the PDF
            images = convert_from_path(pdf_path)
            for image in images:
                temp = pytesseract.image_to_string(image)
                # 去除空行和连续的空格
                temp = '\n'.join([line.strip() for line in temp.split('\n') if line.strip() != ''])
                text += temp
                text_by_page += [temp]
        except Exception as e:
            print(f"Error converting PDF to images: {e}")
            # 根据需要返回空文本或其他默认值
            return '', []
    return text, text_by_page


if __name__ == '__main__':
    pdf_path = 'example.pdf'
    text, text_by_page = extract_text_from_pdf(pdf_path)
    print(text)
    print(text_by_page)