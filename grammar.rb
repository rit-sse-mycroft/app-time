require 'srgs'

module WeatherGrammar
  include Srgs::DSL

  extend self

  grammar 'time' do
    private_rule 'time' do
      item 'Mycroft'
      one_of do
        item 'do you have the time'
        item do
          one_of do
            item "what's"
            item "what is"
          end
          item 'the'
          item '', repeat: '0-1' do
            one_of do
              item 'current'
              item 'exact'
              item 'precise'
            end
          end
          item 'time'
        end
        item 'what time is it'
      end
      item '', repeat: '0-1' do
        one_of do
          item 'at the moment'
          item 'currently'
          item 'right now'
        end
      end
    end
  end
end