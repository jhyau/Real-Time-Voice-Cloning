import matplotlib.pyplot as plt
import numpy as np
import wave
import sys
from scipy import signal    


def visualize_wave(path, step, target):
    spf = wave.open(path + str(step) + "k_steps_"+ str(target) + "_target_pcm.wav", "r")

    # Extract Raw Audio from Wav File
    signal = spf.readframes(-1)
    sample_frequency = 16000
    signal = np.fromstring(signal, "Int16")
    data = np.fromstring(spf.readframes(sample_frequency), dtype=np.int16)
    fs = spf.getframerate()

    channels = [signal[channel::spf.getnchannels()] for channel in range(spf.getnchannels())]

    # for the entire wave file
    signal = signal[:]

    # for a segement of the wave file
    #signal = signal[25000:32000]    
    #left, right = data[0::2], da[1::2]    
    #lf, rf = abs(np.fft.rfft(left)), abs(np.fft.rfft(right))


    # If Stereo
    if spf.getnchannels() == 2:
        print("Just mono files")
        #sys.exit(0)

    Time = np.linspace(0, len(signal)/len(channels)/ fs, num=len(signal)/len(channels))

    #plt.figure(figsize=(7, 4))
    plt.figure(1)
    # Normal amplitude graph of wave file
    a = plt.subplot(211)
    plt.title("Vocoder " + str(step) + "k steps " + str(target) + " target")
    
    # To deal with stereo inputs
    for channel in channels:
        plt.plot(Time, channel)
    a.set_xlabel("Time (seconds)")
    a.set_ylabel("Amplitude")

    # Spectrum of wave file
    c = plt.subplot(212)
    Pxx, freqs, bins, im = c.specgram(signal, NFFT=1024, Fs=16000, noverlap=900)
    c.set_xlabel("Time (seconds)")
    c.set_ylabel("Frequency")
    plt.savefig("./wav_visualizations/vocoder_" + str(step) + "k_steps_" + str(target) + "_target_wav_visualization.png")
    plt.show()

if __name__ == "__main__":
    visualize_wave("./vocoder/saved_models/initial_english_run_modified/", 13, 4)
