# Auto Pan by Window Position

This Chrome extension automatically pans the audio of media elements (`<video>` and `<audio>`) to the left or right channels based on the horizontal position of the browser window relative to the center of the display.

## Features

- **Automatic Audio Panning**: Hear audio from the direction where your browser window is located. If the window is on the left side of the screen, the audio will pan to the left speaker/headphone, and vice versa.
- **Adjustable Pan Rate**: Control the intensity of the panning effect.
- **Vertical Panning Support (PannerNode)**: By default, it uses standard stereo panning. You can enable vertical panning to also affect audio based on vertical window position and simulate distance.
- **Multi-Monitor Support**: You can configure the panning to be calculated relative to:
  - The single display the window is currently on.
  - The primary display (if you use multiple monitors).
  - The aggregate center of all connected displays.

## Usage

Once installed, the extension works automatically in the background. It will attach to any `<video>` and `<audio>` tags on the web pages you visit and adjust the audio panning based on the window's position.

### Settings

Click on the extension icon in the toolbar to open the popup and configure:
- **Enable/Disable**: Toggle the auto-pan functionality.
- **Pan Rate**: Increase or decrease how strongly the audio leans to one side.
- **Vertical Panning (PannerNode)**: Use an advanced vertical spatialization model instead of simple stereo panning.
- **Multi-Monitor**: Calculate pan position relative to the primary display.
- **Multi-Monitor (All)**: Calculate pan position relative to the entire bounds of all combined displays.

## Supported Languages
*   English (en)
*   Japanese (ja)

## License

This project is licensed under dual licenses:
*   [Apache License 2.0](LICENSE-APACHE)
*   [MIT License](LICENSE-MIT)
