import os
from cryptography.fernet import Fernet

ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    raise Exception("ENCRYPTION_KEY environment variable not set")

def get_cipher():
    return Fernet(ENCRYPTION_KEY.encode())

def encrypt(plain_text):
    cipher = get_cipher()
    return cipher.encrypt(plain_text.encode()).decode()

def decrypt(cipher_text):
    cipher = get_cipher()
    return cipher.decrypt(cipher_text.encode()).decode()