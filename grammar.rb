require 'srgs'

module TimeGrammar
  include Srgs::DSL

  extend self

  grammar 'time' do
  	public_rule 'time' do
  		item 'Mycroft'
  		one_of do
  			item do
  				one_of do
  					item 'do you have the time'
  					item do 
  						one_of do
  							item "whats's"
  							item "what is"
  						end
  						item 'the time'
  					end
  					item 'what time is it'
  				end
  			end
  			item do
  				one_of do
  					item do 
  						one_of do
  							item "whats's"
  							item "what is"
  						end
  						item 'the date'
  					end
  					item 'do you have the date'
  				end
  			end
  		end
  	end
  end
end